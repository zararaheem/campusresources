import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, medUnlocked } from '@/lib/auth-helpers';
import { hashPin, validPinFormat } from '@/lib/med-pin';

export const dynamic = 'force-dynamic';

// Change the Medication Management PIN. Requires the view to be unlocked
// already (so the current PIN is known).
export async function POST(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await medUnlocked())) return NextResponse.json({ error: 'locked' }, { status: 403 });
  const { newPin } = await req.json().catch(() => ({}));
  if (!validPinFormat(newPin)) return NextResponse.json({ error: 'bad_format' }, { status: 400 });
  await getStore().setMedPinHash(hashPin(newPin));
  return NextResponse.json({ ok: true });
}
