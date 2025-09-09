import { NextRequest, NextResponse } from 'next/server';
import { getEmailDatabase } from '@/lib/email-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'sent', 'auto-reply', 'manual-reply', or all
    const status = searchParams.get('status'); // 'sent', 'delivered', 'opened', 'failed'
    const threadId = searchParams.get('threadId');
    
    const emailDb = await getEmailDatabase();
    
    const query: Record<string, string> = {};
    
    // Filter by type if specified
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Filter by status if specified
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by thread if specified
    if (threadId) {
      query.threadId = threadId;
    }
    
    // Get emails with filters
    const emails = await emailDb.getSentEmails(limit);
    
    // Apply additional filters if needed
    let filteredEmails = emails;
    if (Object.keys(query).length > 0) {
      filteredEmails = emails.filter(email => {
        let matches = true;
        if (query.type && email.type !== query.type) matches = false;
        if (query.status && email.status !== query.status) matches = false;
        if (query.threadId && email.threadId !== query.threadId) matches = false;
        return matches;
      });
    }
    
    return NextResponse.json({
      ok: true,
      emails: filteredEmails,
      total: filteredEmails.length,
      filters: query
    });
    
  } catch (error: unknown) {
    console.error('Error fetching sent emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sent emails' }, 
      { status: 500 }
    );
  }
}
