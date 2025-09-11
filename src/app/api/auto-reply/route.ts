import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { createOpenAI } from '@/lib/ai';
import { searchMessagesByThreadId, getMessageContentOnDemand } from '@/lib/email-engine';
import { AuthService } from '@/lib/auth';
import { EmailCredentialsDatabase } from '@/lib/email-credentials-db';

export async function POST(req: NextRequest) {
	try {
		const { threadId, action } = await req.json();

		if (!threadId) {
			return NextResponse.json(
				{ error: 'Thread ID is required' },
				{ status: 400 }
			);
		}

		if (action === 'generate') {
			const env = getServerEnv();
			const openai = createOpenAI();

			console.log(`Starting auto-reply generation for thread: ${threadId}`);
			// Resolve active account for the authenticated user
			let accountEmail: string | undefined = undefined;
			try {
				const user = await AuthService.getCurrentUser(req);
				if (user) {
					const db = EmailCredentialsDatabase.getInstance();
					const active = await db.getActiveCredentials(user._id.toString());
					accountEmail = active?.emailId || undefined;
				}
			} catch {}
			if (!accountEmail) {
				return NextResponse.json(
					{ error: 'No active account found for user' },
					{ status: 400 }
				);
			}
			console.log(`Replying as: ${accountEmail}`);

			// Step 1: Get all messages in the thread
			const searchResponse = await searchMessagesByThreadId(threadId, accountEmail);
			
			if (!searchResponse || !searchResponse.messages || searchResponse.messages.length === 0) {
				return NextResponse.json(
					{ error: 'No messages found in thread' },
					{ status: 404 }
				);
			}

			const threadMessages = searchResponse.messages;
			console.log(`Found ${threadMessages.length} messages in thread ${threadId}`);

			// Step 2: Get the content of each message
			const messagesWithContent = [];
			for (const message of threadMessages) {
				try {
					console.log(`Fetching content for message: ${message.id} (${message.subject})`);
					
					// Use text.id if available, otherwise fall back to id
					const contentId = message.text?.id || message.id;
					console.log(`Using content ID: ${contentId} for message ${message.id}`);
					
					const content = await getMessageContentOnDemand(contentId, accountEmail);
					messagesWithContent.push({
						id: message.id,
						from: message.from,
						date: message.date,
						subject: message.subject,
						content: content.html || content.textContent || 'No content available'
					});
					console.log(`Successfully fetched content for message ${message.id} with content length: ${content.html?.length || 0} chars`);
				} catch (error) {
					console.error(`Failed to fetch content for message ${message.id}:`, error);
					// Continue with other messages
				}
			}

			console.log(`Successfully fetched content for ${messagesWithContent.length} out of ${threadMessages.length} messages`);

			// Step 3: Create conversation context for OpenAI
			const conversationContext = messagesWithContent
				.map(msg => `${msg.from.name} (${msg.date}): ${msg.content}`)
				.join('\n\n');

			// Step 4: Generate AI reply using OpenAI
			const prompt = `You are an email assistant. Based on the following email conversation thread, generate a natural and contextual reply. 

IMPORTANT: 
- This is a REPLY to the most recent message, not a new email
- Do NOT include a subject line
- Do NOT include "From:" or "To:" headers
- Generate ONLY the reply content in natural language
- Keep it professional but conversational
- Reference the conversation context appropriately
- Keep it concise (2-4 sentences)

CONTEXT: You are replying as ${accountEmail} - this is your email address and identity or you can find your identity from the conversation context for example you can find name using ${accountEmail} in the conversation context another example 

"from": {
                "name": "Srivathsav Kyatham",
                "address": "srivathsavkyatham@gmail.com"
            },
            "replyTo": [
                {
                    "name": "Srivathsav Kyatham",
                    "address": "srivathsavkyatham@gmail.com"
                }
            ],
            "to": [
                {
                    "name": "me.maverick369",
                    "address": "me.maverick369@gmail.com"
                }
            ], here Srivathsav Kyatham is name and srivathsavkyatham@gmail.com is your email address and me.maverick369 is name and me.maverick369@gmail.com is your email address.

Email Thread:
${conversationContext}

Generate a natural reply as ${accountEmail}:`;

			const completion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: `You are a helpful email assistant that generates natural replies to email conversations. You are replying as ${accountEmail} - this is your email identity and you should write replies as if you are this person.`
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 200,
				temperature: 0.7,
			});

			const reply = completion.choices[0]?.message?.content?.trim();

			if (!reply) {
				return NextResponse.json(
					{ error: 'Failed to generate reply' },
					{ status: 500 }
				);
			}

			return NextResponse.json({
				success: true,
				reply,
				threadId,
				messageCount: messagesWithContent.length
			});

		} else {
			return NextResponse.json(
				{ error: 'Invalid action' },
				{ status: 400 }
			);
		}

	} catch (error) {
		console.error('Error in auto-reply API:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
