import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, medUnlocked, MED_UNLOCK_COOKIE, medUnlockToken } from '@/lib/auth-helpers';
import { verifyPin } from '@/lib/med-pin';

export const dynamic = 'force-dynamic';

// Is this session's Medication Management view unlocked?
export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ unlocked: await medUnlocked() });
}

// Enter the PIN to unlock. Sets a short-lived HttpOnly cookie on success.
export async function POST(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { pin } = await req.json().catch(() => ({}));
  const stored = await getStore().getMedPinHash();
  if (!stored || !verifyPin(pin, stored)) {
    return NextResponse.json({ error: 'bad_pin' }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MED_UNLOCK_COOKIE, medUnlockToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours — re-enter the PIN next school day / session
  });
  return res;
}

// Re-lock (clear the cookie).
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MED_UNLOCK_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
