import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Set or clear a per-section override for one location. Passing an empty
// override (no title/body and not hidden) clears it, reverting to the default.
export async function POST(req, { params }) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
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
