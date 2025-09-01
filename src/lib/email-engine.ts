import { getServerEnv } from "@/lib/env";

export type EmailMessage = {
	id: string;
	uid: number;
	emailId: string;
	threadId: string;
	date: string;
	flags: string[];
	labels: string[];
	unseen: boolean;
	size: number;
	subject: string;
	from: {
		name: string;
		address: string;
	};
	replyTo: Array<{
		name: string;
		address: string;
	}>;
	to: Array<{
		name: string;
		address: string;
	}>;
	messageId: string;
	inReplyTo?: string;
	text: {
		id: string;
		encodedSize: {
			plain: number;
			html: number;
		};
	};
};

export type EmailContent = {
	id: string;
	uid: number;
	emailId: string;
	threadId: string;
	date: string;
	flags: string[];
	labels: string[];
	unseen: boolean;
	size: number;
	subject: string;
	from: {
		name: string;
		address: string;
	};
	replyTo: Array<{
		name: string;
		address: string;
	}>;
	to: Array<{
		name: string;
		address: string;
	}>;
	messageId: string;
	inReplyTo?: string;
	text: {
		id: string;
		encodedSize: {
			plain: number;
			html: number;
		};
	};
	html?: string;
	textContent?: string;
};

export type EmailListResponse = {
	total: number;
	page: number;
	pages: number;
	nextPageCursor: string | null;
	prevPageCursor: string | null;
	messages: EmailMessage[];
};

export type EmailSearchResponse = {
	total: number;
	page: number;
	pages: number;
	nextPageCursor: string | null;
	prevPageCursor: string | null;
	messages: EmailMessage[];
};

export type EmailContentResponse = {
	id: string;
	uid: number;
	emailId: string;
	threadId: string;
	date: string;
	flags: string[];
	labels: string[];
	unseen: boolean;
	size: number;
	subject: string;
	from: {
		name: string;
		address: string;
	};
	replyTo: Array<{
		name: string;
		address: string;
	}>;
	to: Array<{
		name: string;
		address: string;
	}>;
	messageId: string;
	inReplyTo?: string;
	html?: string;
	text?: string;
	plain?: string;
	hasMore?: boolean;
};

export async function getInboxMessages(pageSize: number = 20): Promise<EmailListResponse> {
	const env = getServerEnv();
	const url = `${env.EMAIL_ENGINE_BASE_URL}/v1/account/${env.EMAIL_ENGINE_ACCOUNT}/messages?path=\\All&pageSize=${pageSize}&access_token=${env.EMAIL_ENGINE_API_KEY}`;
	
	console.log('Fetching inbox messages from:', url);
	
	const response = await fetch(url);
	
	if (!response.ok) {
		const errorText = await response.text();
		console.error('Email engine error:', response.status, errorText);
		throw new Error(`Failed to fetch inbox messages: ${response.status} ${response.statusText}`);
	}
	
	const data = await response.json();
	console.log('Inbox messages response:', data);
	
	return data;
}

export async function searchMessagesByThreadId(threadId: string): Promise<EmailSearchResponse> {
	const env = getServerEnv();
	const url = `${env.EMAIL_ENGINE_BASE_URL}/v1/account/${env.EMAIL_ENGINE_ACCOUNT}/search?path=\\All&access_token=${env.EMAIL_ENGINE_API_KEY}`;
	
	console.log('Searching for thread messages:', { threadId, url });
	
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			search: {
				threadId: threadId
			}
		}),
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		console.error('Email engine search error:', response.status, errorText);
		throw new Error(`Failed to search messages: ${response.status} ${response.statusText}`);
	}
	
	const data = await response.json();
	console.log('Search response for thread', threadId, ':', {
		total: data.total,
		messagesCount: data.messages?.length || 0,
		messageIds: data.messages?.map((m: any) => ({ id: m.id, subject: m.subject, from: m.from?.name })) || []
	});
	
	return data;
}

export async function getMessageContent(emailEngineId: string): Promise<EmailContentResponse> {
	const env = getServerEnv();
	const url = `${env.EMAIL_ENGINE_BASE_URL}/v1/account/${env.EMAIL_ENGINE_ACCOUNT}/text/${emailEngineId}?access_token=${env.EMAIL_ENGINE_API_KEY}`;
	
	console.log('Fetching message content for text ID:', emailEngineId);
	
	const response = await fetch(url);
	
	if (!response.ok) {
		const errorText = await response.text();
		console.error('Email engine content error:', response.status, errorText);
		throw new Error(`Failed to fetch message content: ${response.status} ${response.statusText}`);
	}
	
	const data = await response.json();
	console.log('Message content response for', emailEngineId, ':', {
		hasHtml: !!data.html,
		hasPlain: !!data.plain,
		htmlLength: data.html?.length || 0,
		plainLength: data.plain?.length || 0,
		hasMore: data.hasMore
	});
	
	return data;
}

export async function getThreadMessages(threadId: string): Promise<EmailMessage[]> {
	try {
		// First, search for messages in the thread
		const searchResponse = await searchMessagesByThreadId(threadId);
		
		// Return messages without content - content will be loaded on demand
		const messages = searchResponse.messages.map(message => ({
			...message,
			html: undefined,
			textContent: undefined,
		}));
		
		// Sort by date (oldest first)
		return messages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	} catch (error) {
		console.error('Failed to get thread messages:', error);
		throw error;
	}
}

export async function getMessageContentOnDemand(emailEngineId: string): Promise<{ html?: string; textContent?: string }> {
	try {
		const content = await getMessageContent(emailEngineId);
		return {
			html: content.html,
			textContent: content.plain,
		};
	} catch (error) {
		console.error(`Failed to fetch content for message ${emailEngineId}:`, error);
		throw error;
	}
}

export type SendEmailInput = {
	from?: string;
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
	reference?: {
		message: string;
		action: "reply" | "replyAll" | "forward";
		inline?: boolean;
		forwardAttachments?: boolean;
	};
};

export type SendEmailResult = {
	to: string;
	id?: string;
	queueId?: string;
	sentAt?: string;
	success: boolean;
	error?: string;
};

// EmailEngine email service
export async function sendEmailWithEmailEngine(input: SendEmailInput, fromEmail: string): Promise<SendEmailResult[]> {
	const env = getServerEnv();
	const baseUrl = env.EMAIL_ENGINE_BASE_URL;
	const apiKey = env.EMAIL_ENGINE_API_KEY;
	
	if (!baseUrl || !apiKey) {
		throw new Error("EMAIL_ENGINE_BASE_URL and EMAIL_ENGINE_API_KEY are required for EmailEngine");
	}

	const recipients = Array.isArray(input.to) ? input.to : [input.to];
	const results: SendEmailResult[] = [];
	
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

			// Add reference object if this is a reply/forward
			if (input.reference) {
				payload.reference = input.reference;
			}

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
