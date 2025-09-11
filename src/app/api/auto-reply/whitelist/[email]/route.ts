import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { AutoReplyWhitelistDatabase } from '@/lib/auto-reply-whitelist-db';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    await connectToDatabase();
    
    const user = await AuthService.getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await params;
    const emailAddress = decodeURIComponent(email);

    const whitelistDb = AutoReplyWhitelistDatabase.getInstance();
    const removed = await whitelistDb.removeFromWhitelist(user._id, emailAddress);

    if (!removed) {
      return NextResponse.json(
        { error: 'Email address not found in whitelist' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email address removed from whitelist'
    });

  } catch (error) {
    console.error('Error removing from whitelist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
