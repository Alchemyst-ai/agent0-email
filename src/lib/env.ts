
type EnvSpec = {
	OPENAI_API_KEY: string;
	SMTP_HOST?: string;
	SMTP_PORT?: string;
	SMTP_USER?: string;
	SMTP_PASS?: string;
	SMTP_SECURE?: string;
	IMAP_HOST?: string;
	IMAP_PORT?: string;
	IMAP_USER?: string;
	IMAP_PASS?: string;
	IMAP_TLS?: string;
	EMAIL_ENGINE_BASE_URL?: string;
	EMAIL_ENGINE_API_KEY?: string;
};

function readEnv(): EnvSpec {
	return {
		OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
		SMTP_HOST: process.env.SMTP_HOST,
		SMTP_PORT: process.env.SMTP_PORT,
		SMTP_USER: process.env.SMTP_USER,
		SMTP_PASS: process.env.SMTP_PASS,
		SMTP_SECURE: process.env.SMTP_SECURE,
		IMAP_HOST: process.env.IMAP_HOST,
		IMAP_PORT: process.env.IMAP_PORT,
		IMAP_USER: process.env.IMAP_USER,
		IMAP_PASS: process.env.IMAP_PASS,
		IMAP_TLS: process.env.IMAP_TLS,
		EMAIL_ENGINE_BASE_URL: process.env.EMAIL_ENGINE_BASE_URL,
		EMAIL_ENGINE_API_KEY: process.env.EMAIL_ENGINE_API_KEY,
	};
}

export function getServerEnv(): EnvSpec {
	const env = readEnv();
	if (!env.OPENAI_API_KEY) {
		throw new Error("OPENAI_API_KEY is missing in environment");
	}
	return env;
}

export type { EnvSpec };