import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { AutoReplyWhitelistDatabase } from '@/lib/auto-reply-whitelist-db';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const user = await AuthService.getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const whitelistDb = AutoReplyWhitelistDatabase.getInstance();
    const whitelist = await whitelistDb.getWhitelist(user._id);

    return NextResponse.json({
      success: true,
      whitelist: whitelist.map(entry => ({
        id: entry._id.toString(),
        emailAddress: entry.emailAddress,
        createdAt: entry.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching whitelist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const user = await AuthService.getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailAddress } = await request.json();

    if (!emailAddress || typeof emailAddress !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    const whitelistDb = AutoReplyWhitelistDatabase.getInstance();
    
    try {
      const newEntry = await whitelistDb.addToWhitelist({
        userId: user._id,
        emailAddress
      });

      return NextResponse.json({
        success: true,
        entry: {
          id: newEntry._id.toString(),
          emailAddress: newEntry.emailAddress,
          createdAt: newEntry.createdAt
        }
      }, { status: 201 });

    } catch (error) {
      if (error instanceof Error && error.message.includes('already in whitelist')) {
        return NextResponse.json(
          { error: 'Email address already in whitelist' },
          { status: 409 }
        );
      }
      throw error;
    }

  } catch (error) {
    console.error('Error adding to whitelist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
