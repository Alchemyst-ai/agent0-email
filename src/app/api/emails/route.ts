import { NextRequest, NextResponse } from "next/server";
import { getInboxMessages } from "@/lib/email-engine";
import { getServerEnv } from "@/lib/env";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const pageSize = parseInt(searchParams.get('pageSize') || '20');
		
		const env = getServerEnv();
		console.log('Email Engine Config:', {
			baseUrl: env.EMAIL_ENGINE_BASE_URL,
			account: env.EMAIL_ENGINE_ACCOUNT,
			hasApiKey: !!env.EMAIL_ENGINE_API_KEY,
			apiKeyLength: env.EMAIL_ENGINE_API_KEY?.length || 0
		});
		
		const response = await getInboxMessages(pageSize);
		
		return NextResponse.json(response);
	} catch (error: any) {
		console.error('Failed to fetch inbox messages:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to fetch inbox messages' },
			{ status: 500 }
		);
	}
}
