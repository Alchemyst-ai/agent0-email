import Imap from "imap";

export type ImapConfig = {
	host: string;
	port: number;
	user: string;
	password: string;
	tls: boolean;
};

export type EmailMessage = {
	messageId: string;
	from: string;
	subject: string;
	body: string;
	date: Date;
};

function decodeBase64(str: string): string {
	try {
		return Buffer.from(str, "base64").toString("utf8");
	} catch {
		return str;
	}
}

function decodeQuotedPrintable(str: string): string {
	return str
		.replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/=\r\n/g, "")
		.replace(/=\n/g, "");
}

function extractEmailContent(buffer: string): string {
	try {
		const parts = buffer.split("\r\n\r\n");
		if (parts.length < 2) return "";

		const headers = parts[0];
		const body = parts.slice(1).join("\r\n\r\n");

		if (headers.includes("Content-Type: multipart/")) {
			const boundaryMatch = headers.match(/boundary=\"?([^"\r\n]+)\"?/);
			if (boundaryMatch) {
				const boundary = boundaryMatch[1];
				const segments = body.split(`--${boundary}`);

				for (const segment of segments) {
					if (segment.includes("Content-Type: text/html")) {
						const match = segment.match(/\r\n\r\n([\s\S]*?)(?=\r\n--|$)/);
						if (match) {
							const content = match[1].trim();
							return /^[A-Za-z0-9+/=]+$/.test(content) ? decodeBase64(content) : decodeQuotedPrintable(content);
						}
					}
				}

				for (const segment of segments) {
					if (segment.includes("Content-Type: text/plain")) {
						const match = segment.match(/\r\n\r\n([\s\S]*?)(?=\r\n--|$)/);
						if (match) {
							const content = match[1].trim();
							return /^[A-Za-z0-9+/=]+$/.test(content) ? decodeBase64(content) : decodeQuotedPrintable(content);
						}
					}
				}
			}
		} else if (headers.includes("Content-Type: text/html")) {
			const content = body.trim();
			return /^[A-Za-z0-9+/=]+$/.test(content) ? decodeBase64(content) : decodeQuotedPrintable(content);
		} else if (headers.includes("Content-Type: text/plain")) {
			const content = body.trim();
			return /^[A-Za-z0-9+/=]+$/.test(content) ? decodeBase64(content) : decodeQuotedPrintable(content);
		}

		return decodeQuotedPrintable(body.trim());
	} catch {
		return "";
	}
}

export function checkForNewEmails(config: ImapConfig): Promise<EmailMessage[]> {
	return new Promise((resolve, reject) => {
		const imap = new Imap({
			user: config.user,
			password: config.password,
			host: config.host,
			port: config.port,
			tls: config.tls,
			tlsOptions: { rejectUnauthorized: false },
			connTimeout: 10000,
			authTimeout: 10000,
			keepalive: { interval: 300000, idleInterval: 300000, forceNoop: true },
		});

		const emails: EmailMessage[] = [];
		const checkTimeout = setTimeout(() => {
			try { imap.end(); } catch {}
			reject(new Error("IMAP check timed out"));
		}, 20000);

		imap.once("ready", () => {
			imap.openBox("INBOX", false, (err) => {
				if (err) {
					clearTimeout(checkTimeout);
					reject(err);
					return;
				}

				imap.search(["UNSEEN"], (err2, results) => {
					if (err2) {
						clearTimeout(checkTimeout);
						reject(err2);
						return;
					}

					if (results.length === 0) {
						imap.end();
						clearTimeout(checkTimeout);
						resolve([]);
						return;
					}

					const maxFetch = parseInt(process.env.IMAP_MAX_FETCH || "10", 10);
					const ids = results.slice(-maxFetch);

					const fetch = imap.fetch(ids, { bodies: "", markSeen: false, struct: true });

					fetch.on("message", (msg) => {
						let messageId = "";
						let from = "";
						let subject = "";
						let body = "";
						let date = new Date();

						msg.on("body", (stream) => {
							let buffer = "";
							stream.on("data", (chunk) => { buffer += chunk.toString("utf8"); });
							stream.once("end", () => {
								try {
									const hdr = Imap.parseHeader(buffer);
									messageId = (hdr["message-id"]?.[0] || hdr["messageid"]?.[0] || "").trim();
									from = (hdr["from"]?.[0] || "").trim();
									subject = (hdr["subject"]?.[0] || "").trim();
									date = hdr["date"]?.[0] ? new Date(hdr["date"][0]) : date;
									body = extractEmailContent(buffer);
								} catch {}
							});
						});

						msg.once("end", () => {
							emails.push({ messageId, from, subject, body, date });
						});
					});

					fetch.once("error", () => {
						clearTimeout(checkTimeout);
						reject(new Error("IMAP fetch error"));
					});

					fetch.once("end", () => {
						imap.end();
						clearTimeout(checkTimeout);
						resolve(emails);
					});
				});
			});
		});

		imap.once("error", () => {
			clearTimeout(checkTimeout);
			reject(new Error("IMAP connection error"));
		});

		imap.connect();
	});
}

export function getEmailByMessageId(config: ImapConfig, messageId: string): Promise<EmailMessage | null> {
	return new Promise((resolve, reject) => {
		const imap = new Imap({
			user: config.user,
			password: config.password,
			host: config.host,
			port: config.port,
			tls: config.tls,
			tlsOptions: { rejectUnauthorized: false },
		});

		const getTimeout = setTimeout(() => {
			try { imap.end(); } catch {}
			reject(new Error("IMAP fetch by Message-ID timed out"));
		}, 20000);

		imap.once("ready", () => {
			imap.openBox("INBOX", false, (err) => {
				if (err) {
					clearTimeout(getTimeout);
					reject(err);
					return;
				}

				imap.search([["HEADER", "Message-ID", messageId]], (err2, results) => {
					if (err2) {
						clearTimeout(getTimeout);
						reject(err2);
						return;
					}

					if (results.length === 0) {
						imap.end();
						clearTimeout(getTimeout);
						resolve(null);
						return;
					}

					const fetch = imap.fetch(results[0], { bodies: "", markSeen: false });

					fetch.on("message", (msg) => {
						let emailMessageId = "";
						let from = "";
						let subject = "";
						let body = "";
						let date = new Date();

						msg.on("body", (stream) => {
							let buffer = "";
							stream.on("data", (chunk) => { buffer += chunk.toString("utf8"); });
							stream.once("end", () => {
								try {
									const hdr = Imap.parseHeader(buffer);
									emailMessageId = (hdr["message-id"]?.[0] || hdr["messageid"]?.[0] || "").trim();
									from = (hdr["from"]?.[0] || "").trim();
									subject = (hdr["subject"]?.[0] || "").trim();
									date = hdr["date"]?.[0] ? new Date(hdr["date"][0]) : date;
									body = extractEmailContent(buffer);
								} catch {}
							});
						});

						msg.once("end", () => {
							imap.end();
							resolve({ messageId: emailMessageId, from, subject, body, date });
						});
					});

					fetch.once("error", () => {
						clearTimeout(getTimeout);
						reject(new Error("IMAP fetch error"));
					});
				});
			});
		});

		imap.once("error", () => {
			clearTimeout(getTimeout);
			reject(new Error("IMAP connection error"));
		});

		imap.connect();
	});
}