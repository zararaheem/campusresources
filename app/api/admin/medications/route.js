import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor } from '@/lib/auth-helpers';
import { cleanMedRecord, MED_ERRORS } from '@/lib/med';

export const dynamic = 'force-dynamic';

// Staff-only: any signed-in editor (super or campus) may manage medication
// records. Gated by the admin @alpha.school login. Medical data never touches
// the client via a public key — it flows through this server route.

export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const records = await getStore().listMedRecords();
  return NextResponse.json({ records });
}

export async function POST(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

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
