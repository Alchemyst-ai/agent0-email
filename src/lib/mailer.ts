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


