import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { sendEmailSchema } from "@/lib/schemas";
import { createOpenAI } from "@/lib/ai";
import { createMailer, sendEmail, sendEmailWithEmailEngine } from "@/lib/mailer";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = sendEmailSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		const env = getServerEnv();
		const openai = createOpenAI();
		
		const { emails, subject, brief, format, action, useEmailEngine = true } = parsed.data;

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

		// Send emails using either EmailEngine or SMTP
		const results = [];
		const engineType = useEmailEngine && env.EMAIL_ENGINE_BASE_URL && env.EMAIL_ENGINE_API_KEY ? "emailengine" : "smtp";
		
		if (useEmailEngine) {
			if (!env.EMAIL_ENGINE_BASE_URL || !env.EMAIL_ENGINE_API_KEY) {
				return NextResponse.json({ 
					error: "EmailEngine requested but not configured. Please set EMAIL_ENGINE_BASE_URL and EMAIL_ENGINE_API_KEY environment variables." 
				}, { status: 500 });
			}
			
			// Use EmailEngine
			const emailEngineResults = await sendEmailWithEmailEngine(
				{ to: emails, subject: finalSubject, html: html, text: text },
				env.SMTP_USER || ""
			);
			
			results.push(...emailEngineResults);
		} else {
			// Use SMTP (original method)
			const transporter = createMailer({
				host: env.SMTP_HOST,
				port: parseInt(env.SMTP_PORT || "587"),
				secure: env.SMTP_SECURE === "true",
				user: env.SMTP_USER,
				password: env.SMTP_PASS,
			});

			for (const to of emails) {
				try {
					const info = await sendEmail(transporter, {
						from: env.SMTP_USER,
						to: to,
						subject: finalSubject,
						html: html,
						text: text,
					});
					results.push({ to, id: info.messageId, success: true });
				} catch (err: any) {
					results.push({ to, error: err?.message || "Failed to send", success: false });
				}
			}
		}

		return NextResponse.json({ ok: true, results, engine: engineType });
	} catch (e) {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}


