import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { EmailCredentialsDatabase } from '@/lib/email-credentials-db';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    // Get authenticated user
    const user = await AuthService.getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const credentialsDb = EmailCredentialsDatabase.getInstance();
    const credentials = await credentialsDb.getCredentialsById(id);

    if (!credentials) {
      return NextResponse.json(
        { error: 'Email credentials not found' },
        { status: 404 }
      );
    }

    // Check if credentials belong to the authenticated user
    if (credentials.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Set this credentials as active
    const success = await credentialsDb.setActiveCredentials(user._id.toString(), id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to switch active credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Active credentials switched successfully',
      activeCredentialsId: id,
    });
  } catch (error) {
    console.error('Error switching active credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
