import { NextRequest, NextResponse } from 'next/server';
import { getAutoReplyEnabled, setAutoReplyEnabled } from '@/lib/settings';

export async function GET() {
  return NextResponse.json({ enabled: getAutoReplyEnabled() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 });
    }
    setAutoReplyEnabled(body.enabled);
    return NextResponse.json({ ok: true, enabled: getAutoReplyEnabled() });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


