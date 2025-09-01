
type EnvSpec = {
	OPENAI_API_KEY: string;
	EMAIL_ENGINE_BASE_URL: string;
	EMAIL_ENGINE_API_KEY: string;
	EMAIL_ENGINE_ACCOUNT: string;
};

function readEnv(): EnvSpec {
	return {
		OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
		EMAIL_ENGINE_BASE_URL: process.env.EMAIL_ENGINE_BASE_URL || "",
		EMAIL_ENGINE_API_KEY: process.env.EMAIL_ENGINE_API_KEY || "",
		EMAIL_ENGINE_ACCOUNT: process.env.EMAIL_ENGINE_ACCOUNT || "",
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
	return env;
}

export type { EnvSpec };