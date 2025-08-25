import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { replyActionSchema } from "@/lib/schemas";
import { createOpenAI, generateEmailReply } from "@/lib/ai";
import { checkForNewEmails, getEmailByMessageId } from "@/lib/imap";
import { createMailer, sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = replyActionSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		const { 
			SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE,
			IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS, IMAP_TLS 
		} = getServerEnv();

		const openai = createOpenAI();
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
				finalReplyText = await generateEmailReply(openai, {
					from: originalEmail.from,
					subject: originalEmail.subject,
					body: originalEmail.body,
				});
			}

			if (!finalReplyText) {
				return NextResponse.json({ error: "Reply text required" }, { status: 400 });
			}

			const transporter = createMailer({
				host: SMTP_HOST,
				port: parseInt(SMTP_PORT || "587"),
				user: SMTP_USER,
				password: SMTP_PASS,
				secure: SMTP_SECURE === "true",
			});

			const result = await sendEmail(transporter, {
				from: SMTP_USER,
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
