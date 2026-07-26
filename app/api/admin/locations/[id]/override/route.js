import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, canEditLocation } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Set or clear a per-section override for one location (hide/show + local text).
// Allowed for superadmins and the DOP(s) assigned to that campus.
export async function POST(req, { params }) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const loc = await getStore().getLocation(id);
  if (!loc) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!canEditLocation(editor, loc.code)) {
    return NextResponse.json({ error: 'You can only edit your assigned campus.' }, { status: 403 });
  }

  const body = await req.json();
  const sectionKey = String(body.sectionKey || '').trim();
  if (!sectionKey) return NextResponse.json({ error: 'sectionKey required' }, { status: 400 });

  const ov = {};
  if (body.title) ov.title = String(body.title);
  if (body.body) ov.body = String(body.body);
  if (body.hidden) ov.hidden = true;

  const updated = await getStore().setOverride(id, sectionKey, ov);
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ location: updated });
}
