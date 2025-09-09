import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { AuthService } from '@/lib/auth';
import { EmailCredentialsDatabase } from '@/lib/email-credentials-db';

export async function GET(req: NextRequest) {
	try {
		const env = getServerEnv();
		let account = env.EMAIL_ENGINE_ACCOUNT;
		try {
			const user = await AuthService.getCurrentUser(req);
			if (user) {
				const db = EmailCredentialsDatabase.getInstance();
				const active = await db.getActiveCredentials(user._id.toString());
				if (active?.emailId) account = active.emailId;
			}
		} catch {}
		return NextResponse.json({ account });
	} catch (error) {
		console.error('Error getting account info:', error);
		return NextResponse.json(
			{ error: 'Failed to get account info' },
			{ status: 500 }
		);
	}
}
