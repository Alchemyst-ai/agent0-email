import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

const requestSchema = z.object({
	emails: z.array(z.string().email()).min(1),
	subject: z.string().min(3).max(120),
	brief: z.string().min(10).max(4000),
	format: z.enum(["formal", "casual", "friendly", "concise"]).default("friendly"),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = requestSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		const { OPENAI_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = getServerEnv();
		const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
		
		const transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: parseInt(SMTP_PORT || "587"),
			secure: SMTP_SECURE === "true",
			auth: { user: SMTP_USER, pass: SMTP_PASS },
		});

		const { emails, subject, brief, format } = parsed.data;

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

		const results = [];
		for (const to of emails) {
			try {
				const info = await transporter.sendMail({
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


