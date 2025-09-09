
type EnvSpec = {
	OPENAI_API_KEY: string;
	EMAIL_ENGINE_BASE_URL: string;
	EMAIL_ENGINE_API_KEY: string;
	EMAIL_ENGINE_ACCOUNT: string;
	MONGODB_URI: string;
	JWT_SECRET: string;
	PASSWORD_CRYPTO_SECRET: string;
};

function readEnv(): EnvSpec {
	return {
		OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
		EMAIL_ENGINE_BASE_URL: process.env.EMAIL_ENGINE_BASE_URL || "",
		EMAIL_ENGINE_API_KEY: process.env.EMAIL_ENGINE_API_KEY || "",
		EMAIL_ENGINE_ACCOUNT: process.env.EMAIL_ENGINE_ACCOUNT || "",
		MONGODB_URI: process.env.MONGODB_URI || "",
		JWT_SECRET: process.env.JWT_SECRET || "",
		PASSWORD_CRYPTO_SECRET: process.env.PASSWORD_CRYPTO_SECRET || "",
	};
}

export function getServerEnv(): EnvSpec {
	const env = readEnv();
	if (!env.OPENAI_API_KEY) {
		throw new Error("OPENAI_API_KEY is missing in environment");
	}
	if (!env.EMAIL_ENGINE_BASE_URL) {
		throw new Error("EMAIL_ENGINE_BASE_URL is missing in environment");
	}
	if (!env.EMAIL_ENGINE_API_KEY) {
		throw new Error("EMAIL_ENGINE_API_KEY is missing in environment");
	}
	if (!env.EMAIL_ENGINE_ACCOUNT) {
		throw new Error("EMAIL_ENGINE_ACCOUNT is missing in environment");
	}
	if (!env.MONGODB_URI) {
		throw new Error("MONGODB_URI is missing in environment");
	}
	if (!env.JWT_SECRET) {
		throw new Error("JWT_SECRET is missing in environment");
	}
	if (!env.PASSWORD_CRYPTO_SECRET) {
		throw new Error("PASSWORD_CRYPTO_SECRET is missing in environment");
	}
	return env;
}

export type { EnvSpec };