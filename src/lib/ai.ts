import OpenAI from "openai";
import { getServerEnv } from "@/lib/env";

export function createOpenAI(): OpenAI {
	const { OPENAI_API_KEY } = getServerEnv();
	return new OpenAI({ apiKey: OPENAI_API_KEY });
}

export async function generateEmailReply(openai: OpenAI, args: {
	from: string;
	subject: string;
	body: string;
}): Promise<string> {
	const system = `You are an email assistant that generates thoughtful, professional replies. 
Keep responses concise, helpful, and maintain a professional tone. 
Always acknowledge the original message and provide relevant information or assistance.`;

	const userPrompt = `Original email from: ${args.from}\nSubject: ${args.subject}\nBody: ${args.body}\n\nPlease generate a professional reply to this email. Keep it concise and helpful.`;

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


