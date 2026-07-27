import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, accessToken, expectedAccessCode, codeLoginEnabled } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Exchange a shared access code for an editor session cookie (only when code
// login is enabled via ADMIN_ACCESS_CODE; otherwise /admin is Google-only).
export async function POST(req) {
  if (!codeLoginEnabled()) {
    return NextResponse.json({ error: 'Code login is disabled. Use Sign in with Google.' }, { status: 403 });
  }
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
