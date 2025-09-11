import { NextRequest, NextResponse } from 'next/server';
import { getGlobalAutoReplyEnabled, setGlobalAutoReplyEnabled } from '@/lib/settings-db';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  await connectToDatabase();
  const enabled = await getGlobalAutoReplyEnabled();
  return NextResponse.json({ enabled });
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 });
    }
    await setGlobalAutoReplyEnabled(body.enabled);
    return NextResponse.json({ ok: true, enabled: await getGlobalAutoReplyEnabled() });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}


