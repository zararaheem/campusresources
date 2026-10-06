import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, medUnlocked } from '@/lib/auth-helpers';
import { cleanMedRecord, MED_ERRORS } from '@/lib/med';

export const dynamic = 'force-dynamic';

// Staff-only: any signed-in editor (super or campus) may manage medication
// records. Two gates — the admin login AND the Medication Management PIN
// (medUnlocked). Medical data never touches the client via a public key.

export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await medUnlocked())) return NextResponse.json({ error: 'locked' }, { status: 403 });
  const records = await getStore().listMedRecords();
  return NextResponse.json({ records });
}

export async function POST(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await medUnlocked())) return NextResponse.json({ error: 'locked' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const code = body.code ? String(body.code).trim().toLowerCase() : null;
  const record = cleanMedRecord(body.record || {});
  try {
    const savedCode = await getStore().saveMedRecord(code, record);
    return NextResponse.json({ code: savedCode });
  } catch (e) {
    const msg = e?.message || 'save_failed';
    return NextResponse.json({ error: MED_ERRORS.has(msg) ? msg : 'save_failed' }, { status: 400 });
  }
}
