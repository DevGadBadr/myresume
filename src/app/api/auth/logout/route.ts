import { NextResponse } from 'next/server';
import { clearAuthSession } from '@/lib/auth';

export async function POST() {
  try {
    await clearAuthSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/auth/logout error:', error);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}
