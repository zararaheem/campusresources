import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, accessToken, expectedAccessCode } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Exchange a shared access code for an editor session cookie (temporary login
// while Google OAuth is being configured).
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').trim();
  if (!code || code !== expectedAccessCode()) {
    return NextResponse.json({ error: 'Incorrect access code.' }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, accessToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return NextResponse.json({ ok: true });
}

// Sign out of the code session.
export async function DELETE() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
