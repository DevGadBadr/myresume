import { NextResponse } from 'next/server';
import { setAuthSession, verifyAdminCredentials } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const username = body.username?.trim() ?? '';
    const password = body.password ?? '';

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    await setAuthSession(username);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 });
  }
}
