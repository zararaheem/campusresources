import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { code } = await params;
  await getStore().deleteMedRecord(String(code || '').trim().toLowerCase());
  return NextResponse.json({ ok: true });
}
