import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { EmailCredentialsDatabase } from '@/lib/email-credentials-db';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
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

    // Remove sensitive data before sending to client
    const safeCredentials = {
      id: credentials._id.toString(),
      emailId: credentials.emailId,
      provider: credentials.provider,
      providerIMAPHost: credentials.providerIMAPHost,
      providerIMAPPort: credentials.providerIMAPPort,
      providerSMTPHost: credentials.providerSMTPHost,
      providerSMTPPort: credentials.providerSMTPPort,
      providerInboxName: credentials.providerInboxName,
      providerSentBoxName: credentials.providerSentBoxName,
      isActive: credentials.isActive,
      sendingLimitExceeded: credentials.sendingLimitExceeded,
      createdAt: credentials.createdAt,
      updatedAt: credentials.updatedAt,
    };

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const updateData = await request.json();
    
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

    // Update credentials
    const updatedCredentials = await credentialsDb.updateCredentials(id, updateData);

    if (!updatedCredentials) {
      return NextResponse.json(
        { error: 'Failed to update credentials' },
        { status: 500 }
      );
    }

    // Remove sensitive data before sending to client
    const safeCredentials = {
      id: updatedCredentials._id.toString(),
      emailId: updatedCredentials.emailId,
      provider: updatedCredentials.provider,
      isActive: updatedCredentials.isActive,
      sendingLimitExceeded: updatedCredentials.sendingLimitExceeded,
      updatedAt: updatedCredentials.updatedAt,
    };

    return NextResponse.json({
      message: 'Credentials updated successfully',
      credentials: safeCredentials,
    });
  } catch (error) {
    console.error('Error updating email credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete credentials
    const deleted = await credentialsDb.deleteCredentials(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Credentials deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting email credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
