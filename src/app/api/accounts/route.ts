import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { EmailCredentialsDatabase } from '@/lib/email-credentials-db';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get authenticated user
    const user = await AuthService.getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const credentialsDb = EmailCredentialsDatabase.getInstance();
    const credentials = await credentialsDb.getUserCredentials(user._id.toString());

    // Remove sensitive data before sending to client
    const safeCredentials = credentials.map(cred => ({
      id: cred._id.toString(),
      emailId: cred.emailId,
      provider: cred.provider,
      isActive: cred.isActive,
      sendingLimitExceeded: cred.sendingLimitExceeded,
      createdAt: cred.createdAt,
      updatedAt: cred.updatedAt,
    }));

    return NextResponse.json({
      credentials: safeCredentials,
    });
  } catch (error) {
    console.error('Error fetching email credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
