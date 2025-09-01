import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';

export async function GET() {
	try {
		const env = getServerEnv();
		return NextResponse.json({ 
			account: env.EMAIL_ENGINE_ACCOUNT 
		});
	} catch (error) {
		console.error('Error getting account info:', error);
		return NextResponse.json(
			{ error: 'Failed to get account info' },
			{ status: 500 }
		);
	}
}
