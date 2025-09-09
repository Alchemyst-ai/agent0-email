import { NextRequest, NextResponse } from "next/server";
import { getThreadMessages } from "@/lib/email-engine";
import { AuthService } from "@/lib/auth";
import { EmailCredentialsDatabase } from "@/lib/email-credentials-db";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ threadId: string }> }
) {
	try {
		const { threadId } = await params;
		
		if (!threadId) {
			return NextResponse.json(
				{ error: 'Thread ID is required' },
				{ status: 400 }
			);
		}
		
		console.log('Fetching thread messages for threadId:', threadId);
		
		let accountEmail: string | undefined = undefined;
		try {
			const user = await AuthService.getCurrentUser(req);
			if (user) {
				const db = EmailCredentialsDatabase.getInstance();
				const active = await db.getActiveCredentials(user._id.toString());
				accountEmail = active?.emailId || undefined;
			}
		} catch {}
		
		const messages = await getThreadMessages(threadId, accountEmail);
		
		console.log('Thread messages response:', {
			count: messages.length,
			firstMessage: messages[0] ? {
				id: messages[0].id,
				messageId: messages[0].messageId,
				subject: messages[0].subject,
				textId: messages[0].text?.id
			} : null,
			messageIds: messages.map(m => ({ id: m.id, textId: m.text?.id }))
		});
		
		return NextResponse.json({ messages });
	} catch (error) {
		console.error('Failed to fetch thread messages:', error);
		return NextResponse.json(
			{ error: (error as Error).message || 'Failed to fetch thread messages' },
			{ status: 500 }
		);
	}
}
