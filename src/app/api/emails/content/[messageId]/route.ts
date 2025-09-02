import { NextRequest, NextResponse } from "next/server";
import { getMessageContentOnDemand } from "@/lib/email-engine";

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
		
		const content = await getMessageContentOnDemand(messageId);
		
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
