import { NextRequest, NextResponse } from "next/server";
import { getMessageContentOnDemand } from "@/lib/email-engine";
import { AuthService } from "@/lib/auth";
import { EmailCredentialsDatabase } from "@/lib/email-credentials-db";
import { getServerEnv } from "@/lib/env";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ messageId: string }> }
) {
	try {
		const { messageId } = await params;
		
		if (!messageId) {
			return NextResponse.json(
				{ error: 'Message ID is required' },
				{ status: 400 }
			);
		}
		
		console.log('Fetching content for message ID:', messageId);

		// Resolve active account email to query EmailEngine correctly
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
			const env = getServerEnv();
			accountEmail = env.EMAIL_ENGINE_ACCOUNT;
		}

		const content = await getMessageContentOnDemand(messageId, accountEmail);
		
		console.log('Message content response:', {
			messageId,
			hasHtml: !!content.html,
			hasTextContent: !!content.textContent,
			htmlLength: content.html?.length || 0,
			textContentLength: content.textContent?.length || 0
		});
		
		return NextResponse.json(content);
	} catch (error) {
		console.error('Failed to fetch message content:', error);
		return NextResponse.json(
			{ error: (error as Error).message || 'Failed to fetch message content' },
			{ status: 500 }
		);
	}
}
