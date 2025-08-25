import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { sendEmailSchema } from "@/lib/schemas";
import { createOpenAI } from "@/lib/ai";
import { createMailer, sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = sendEmailSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = getServerEnv();
		const openai = createOpenAI();
		
		const transporter = createMailer({
			host: SMTP_HOST,
			port: parseInt(SMTP_PORT || "587"),
			secure: SMTP_SECURE === "true",
			user: SMTP_USER,
			password: SMTP_PASS,
		});

		const { emails, subject, brief, format, action } = parsed.data;

		const system = "You are an assistant that writes clear, actionable emails. Keep it polite and include a short CTA.";
		const formatInstruction = format === "formal" ? "Write in a professional tone." : 
								 format === "casual" ? "Write in a relaxed tone." : 
								 format === "concise" ? "Write concisely." : 
								 "Write in a friendly tone.";

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{ role: "system", content: system },
				{ role: "user", content: `${formatInstruction}\n\nSubject: ${subject}\n\nBrief: ${brief}\n\nPlease produce JSON with keys: subject, html, text.` },
			],
			response_format: { type: "json_object" },
			temperature: 0.7,
		});

		const content = completion.choices[0]?.message?.content || "{}";
		let generated: { subject?: string; html?: string; text?: string };
		try {
			generated = JSON.parse(content);
		} catch {
			return NextResponse.json({ error: "Failed to generate email" }, { status: 502 });
		}

		const finalSubject = generated.subject || subject;
		const html = generated.html || `<p>${generated.text || brief}</p>`;
		const text = generated.text || brief;

		// If action is preview, return the generated content without sending
		if (action === "preview") {
			return NextResponse.json({ 
				ok: true, 
				preview: {
					subject: finalSubject,
					html: html,
					text: text,
				}
			});
		}

		// Otherwise, send the email
		const results = [];
		for (const to of emails) {
			try {
				const info = await sendEmail(transporter, {
					from: SMTP_USER,
					to: to,
					subject: finalSubject,
					html: html,
					text: text,
				});
				results.push({ to, id: info.messageId });
			} catch (err: any) {
				results.push({ to, error: err?.message || "Failed to send" });
			}
		}

		return NextResponse.json({ ok: true, results });
	} catch (e) {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}


