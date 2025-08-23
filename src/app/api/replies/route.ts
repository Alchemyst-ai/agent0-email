import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import nodemailer from "nodemailer";
import Imap from "imap";
import { getServerEnv } from "@/lib/env";

const replySchema = z.object({
	action: z.enum(["check", "reply"]),
	messageId: z.string().optional(),
	replyText: z.string().optional(),
	autoReply: z.boolean().default(false),
});

interface EmailMessage {
	messageId: string;
	from: string;
	subject: string;
	body: string;
	date: Date;
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = replySchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		const { 
			OPENAI_API_KEY, 
			SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE,
			IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS, IMAP_TLS 
		} = getServerEnv();

		const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
		const { action, messageId, replyText, autoReply } = parsed.data;

		if (action === "check") {
			if (!IMAP_HOST || !IMAP_USER || !IMAP_PASS) {
				return NextResponse.json({ error: "IMAP not configured" }, { status: 400 });
			}
			
			const newEmails = await checkForNewEmails({
				host: IMAP_HOST,
				port: parseInt(IMAP_PORT || "993"),
				user: IMAP_USER,
				password: IMAP_PASS,
				tls: IMAP_TLS === "true",
			});

			return NextResponse.json({ 
				ok: true, 
				newEmails,
				count: newEmails.length 
			});
		}

		if (action === "reply") {
			if (!messageId) {
				return NextResponse.json({ error: "Message ID required" }, { status: 400 });
			}

			if (!IMAP_HOST || !IMAP_USER || !IMAP_PASS || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
				return NextResponse.json({ error: "Email not configured" }, { status: 400 });
			}

			const originalEmail = await getEmailByMessageId({
				host: IMAP_HOST,
				port: parseInt(IMAP_PORT || "993"),
				user: IMAP_USER,
				password: IMAP_PASS,
				tls: IMAP_TLS === "true",
			}, messageId);

			if (!originalEmail) {
				return NextResponse.json({ error: "Email not found" }, { status: 404 });
			}

			let finalReplyText = replyText;

			if (autoReply && !replyText) {
				finalReplyText = await generateAIReply(openai, originalEmail);
			}

			if (!finalReplyText) {
				return NextResponse.json({ error: "Reply text required" }, { status: 400 });
			}

			const result = await sendReply({
				host: SMTP_HOST,
				port: parseInt(SMTP_PORT || "587"),
				user: SMTP_USER,
				password: SMTP_PASS,
				secure: SMTP_SECURE === "true",
			}, {
				to: originalEmail.from,
				subject: `Re: ${originalEmail.subject}`,
				text: finalReplyText,
				html: `<p>${finalReplyText.replace(/\n/g, '<br>')}</p>`,
				inReplyTo: originalEmail.messageId,
				references: originalEmail.messageId,
			});

			return NextResponse.json({ 
				ok: true, 
				result,
				originalEmail: {
					messageId: originalEmail.messageId,
					from: originalEmail.from,
					subject: originalEmail.subject,
				},
				replyText: finalReplyText,
			});
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (e) {
		console.error("Reply handling error:", e);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}

async function checkForNewEmails(config: {
	host: string;
	port: number;
	user: string;
	password: string;
	tls: boolean;
}): Promise<EmailMessage[]> {
	return new Promise((resolve, reject) => {
		const imap = new Imap({
			user: config.user,
			password: config.password,
			host: config.host,
			port: config.port,
			tls: config.tls,
			tlsOptions: { rejectUnauthorized: false },
			connTimeout: 10000,
			authTimeout: 10000,
			keepalive: { interval: 300000, idleInterval: 300000, forceNoop: true },
			debug: process.env.IMAP_DEBUG === "true" ? (msg: string) => console.log("[IMAP check]", msg) : undefined,
		});

		const emails: EmailMessage[] = [];

		// Add a hard timeout to prevent hanging IMAP operations
		const checkTimeout = setTimeout(() => {
			try { imap.end(); } catch {}
			reject(new Error("IMAP check timed out"));
		}, 20000);

		imap.once("ready", () => {
			imap.openBox("INBOX", false, (err, box) => {
				if (err) {
					clearTimeout(checkTimeout);
					reject(err);
					return;
				}

				// Search for unseen emails
				imap.search(["UNSEEN"], (err, results) => {
					if (err) {
						clearTimeout(checkTimeout);
						reject(err);
						return;
					}

					if (results.length === 0) {
						imap.end();
						clearTimeout(checkTimeout);
						resolve([]);
						return;
					}

					// Only fetch the last N unseen to avoid huge payloads
					const maxFetch = parseInt(process.env.IMAP_MAX_FETCH || "10", 10);
					const ids = results.slice(-maxFetch);
					const fetch = imap.fetch(ids, {
						// Fetch full message
						bodies: "",
						markSeen: false,
					});

					fetch.on("message", (msg, seqno) => {
						let messageId = "";
						let from = "";
						let subject = "";
						let body = "";
						let date = new Date();

						msg.on("body", (stream, info) => {
							let buffer = "";
							stream.on("data", (chunk) => {
								buffer += chunk.toString("utf8");
							});
							stream.once("end", () => {
								try {
									// Parse headers from the full message
									const hdr = Imap.parseHeader(buffer);
									messageId = (hdr["message-id"]?.[0] || hdr["messageid"]?.[0] || "").trim();
									from = (hdr["from"]?.[0] || "").trim();
									subject = (hdr["subject"]?.[0] || "").trim();
									date = hdr["date"]?.[0] ? new Date(hdr["date"][0]) : date;
									
									// Extract body content (everything after headers)
									const bodyStart = buffer.indexOf('\r\n\r\n');
									if (bodyStart !== -1) {
										let rawBody = buffer.substring(bodyStart + 4);
										
										// Try to extract plain text content
										const textMatch = rawBody.match(/Content-Type: text\/plain[^]*?\r\n\r\n([^]*?)(?=\r\n--|$)/);
										if (textMatch) {
											body = textMatch[1].slice(0, 2048);
										} else {
											// Fallback to first 2048 chars of raw body
											body = rawBody.slice(0, 2048);
										}
										
										// Decode quoted-printable encoding and clean up
										body = body.replace(/=20/g, ' ').replace(/=\r\n/g, '').replace(/=\n/g, '');
										body = body.replace(/\r\n/g, '\n').replace(/\n\s*\n/g, '\n').trim();
									}
								} catch {}
							});
						});

						msg.once("attributes", (attrs) => {
							// No-op: we already parsed headers above; keep fallback minimal
							messageId = messageId || (attrs as any)?.envelope?.messageId || "";
						});

						msg.once("end", () => {
							emails.push({
								messageId,
								from,
								subject,
								body,
								date,
							});
						});
					});

					fetch.once("error", (err: Error) => {
						clearTimeout(checkTimeout);
						reject(err);
					});

					fetch.once("end", () => {
						imap.end();
						clearTimeout(checkTimeout);
						resolve(emails);
					});
				});
			});
		});

		imap.once("error", (err: Error) => {
			clearTimeout(checkTimeout);
			reject(err);
		});

		imap.once("end", () => {
			clearTimeout(checkTimeout);
			console.log("[IMAP check] connection ended");
		});

		imap.once("close", () => {
			clearTimeout(checkTimeout);
			console.log("[IMAP check] connection closed");
		});

		imap.connect();
	});
}

async function getEmailByMessageId(config: {
	host: string;
	port: number;
	user: string;
	password: string;
	tls: boolean;
}, messageId: string): Promise<EmailMessage | null> {
	return new Promise((resolve, reject) => {
		const imap = new Imap({
			user: config.user,
			password: config.password,
			host: config.host,
			port: config.port,
			tls: config.tls,
			tlsOptions: { rejectUnauthorized: false },
		});

		// Add a hard timeout to prevent hanging for get by Message-ID
		const getTimeout = setTimeout(() => {
			try { imap.end(); } catch {}
			reject(new Error("IMAP fetch by Message-ID timed out"));
		}, 20000);

		imap.once("ready", () => {
			imap.openBox("INBOX", false, (err, box) => {
				if (err) {
					clearTimeout(getTimeout);
					reject(err);
					return;
				}

				// Search for the specific message ID
				imap.search([["HEADER", "Message-ID", messageId]], (err, results) => {
					if (err) {
						clearTimeout(getTimeout);
						reject(err);
						return;
					}

					if (results.length === 0) {
						imap.end();
						clearTimeout(getTimeout);
						resolve(null);
						return;
					}

					const fetch = imap.fetch(results[0], {
						bodies: "HEADER.FIELDS (MESSAGE-ID FROM SUBJECT DATE)",
						markSeen: false,
					});

					fetch.on("message", (msg, seqno) => {
						let emailMessageId = "";
						let from = "";
						let subject = "";
						let body = "";
						let date = new Date();

						msg.on("body", (stream, info) => {
							let buffer = "";
							stream.on("data", (chunk) => {
								buffer += chunk.toString("utf8");
							});
							stream.once("end", () => {
								try {
									const hdr = Imap.parseHeader(buffer);
									emailMessageId = (hdr["message-id"]?.[0] || hdr["messageid"]?.[0] || "").trim();
									from = (hdr["from"]?.[0] || "").trim();
									subject = (hdr["subject"]?.[0] || "").trim();
									date = hdr["date"]?.[0] ? new Date(hdr["date"][0]) : date;
								} catch {}
							});
						});

						msg.once("end", () => {
							imap.end();
							resolve({
								messageId: emailMessageId,
								from,
								subject,
								body,
								date,
							});
						});
					});

					fetch.once("error", (err: Error) => {
						clearTimeout(getTimeout);
						reject(err);
					});
				});
			});
		});

		imap.once("error", (err: Error) => {
			clearTimeout(getTimeout);
			reject(err);
		});

		imap.connect();
	});
}

async function generateAIReply(openai: OpenAI, originalEmail: EmailMessage): Promise<string> {
	const system = `You are an email assistant that generates thoughtful, professional replies. 
	Keep responses concise, helpful, and maintain a professional tone. 
	Always acknowledge the original message and provide relevant information or assistance.`;

	const userPrompt = `Original email from: ${originalEmail.from}
Subject: ${originalEmail.subject}
Body: ${originalEmail.body}

Please generate a professional reply to this email. Keep it concise and helpful.`;

	const completion = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{ role: "system", content: system },
			{ role: "user", content: userPrompt },
		],
		temperature: 0.7,
		max_tokens: 300,
	});

	return completion.choices[0]?.message?.content || "Thank you for your email. I'll get back to you soon.";
}

async function sendReply(config: {
	host: string;
	port: number;
	user: string;
	password: string;
	secure: boolean;
}, emailData: {
	to: string;
	subject: string;
	text: string;
	html: string;
	inReplyTo: string;
	references: string;
}) {
	const transporter = nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure,
		auth: {
			user: config.user,
			pass: config.password,
		},
	});

	const mailOptions = {
		from: config.user,
		to: emailData.to,
		subject: emailData.subject,
		text: emailData.text,
		html: emailData.html,
		inReplyTo: emailData.inReplyTo,
		references: emailData.references,
	};

	const info = await transporter.sendMail(mailOptions);
	return {
		messageId: info.messageId,
		response: info.response,
	};
}
