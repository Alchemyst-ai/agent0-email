import nodemailer, { Transporter } from "nodemailer";
import { getServerEnv } from "@/lib/env";

export type MailConfig = {
	host: string;
	port: number;
	secure: boolean;
	user: string;
	password: string;
};

export type SendEmailInput = {
	from?: string;
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
	inReplyTo?: string;
	references?: string | string[];
};

export function createMailer(config?: Partial<MailConfig>): Transporter {
	const env = getServerEnv();
	const resolved: MailConfig = {
		host: config?.host || env.SMTP_HOST || "",
		port: config?.port || parseInt(env.SMTP_PORT || "587"),
		secure: config?.secure ?? (env.SMTP_SECURE === "true"),
		user: config?.user || env.SMTP_USER || "",
		password: config?.password || env.SMTP_PASS || "",
	};

	return nodemailer.createTransport({
		host: resolved.host,
		port: resolved.port,
		secure: resolved.secure,
		auth: {
			user: resolved.user,
			pass: resolved.password,
		},
	});
}

export async function sendEmail(transporter: Transporter, input: SendEmailInput) {
	const info = await transporter.sendMail({
		from: input.from,
		to: input.to,
		subject: input.subject,
		text: input.text,
		html: input.html,
		inReplyTo: input.inReplyTo,
		references: input.references,
	});

	return { messageId: info.messageId, response: info.response };
}

// EmailEngine email service
export async function sendEmailWithEmailEngine(input: SendEmailInput, fromEmail: string) {
	const env = getServerEnv();
	const baseUrl = env.EMAIL_ENGINE_BASE_URL;
	const apiKey = env.EMAIL_ENGINE_API_KEY;
	
	if (!baseUrl || !apiKey) {
		throw new Error("EMAIL_ENGINE_BASE_URL and EMAIL_ENGINE_API_KEY are required for EmailEngine");
	}

	const recipients = Array.isArray(input.to) ? input.to : [input.to];
	const results = [];
	
	// Check if it's a Microsoft domain (hotmail/outlook)
	const isMicrosoftDomain = /@(hotmail|outlook)\.com$/i.test(fromEmail);

	for (const recipient of recipients) {
		try {
			const payload: any = {
				to: [
					{
						address: recipient,
					},
				],
				subject: input.subject,
				text: input.text || '',
				html: input.html,
				trackOpens: true,
			};

			// EmailEngine handles Microsoft domains differently
			if (isMicrosoftDomain) {
				payload.from = {
					address: fromEmail,
				};
			} else {
				payload.gateway = fromEmail;
			}

			const response = await fetch(
				`${baseUrl}/v1/account/${fromEmail}/submit?access_token=${apiKey}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(payload),
				}
			);

			const data = await response.json();

			if (response.ok) {
				results.push({
					to: recipient,
					id: data.messageId,
					queueId: data.queueId,
					sentAt: data.sentAt,
					success: true,
				});
			} else {
				results.push({
					to: recipient,
					error: data.error || data.message || 'Failed to send email',
					success: false,
				});
			}
		} catch (error: any) {
			results.push({
				to: recipient,
				error: error?.message || "Failed to send",
				success: false,
			});
		}
	}

	return results;
}


