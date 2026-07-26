import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, isSuper } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Update a shared/default section (applies to every campus unless overridden).
// Global text is superadmin-only.
export async function PATCH(req, { params }) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isSuper(editor)) return NextResponse.json({ error: 'Superadmins only.' }, { status: 403 });

  const { key } = await params;
  const body = await req.json();
  const patch = {};
  for (const k of ['title', 'body', 'group_name', 'position']) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  const updated = await getStore().updateSection(key, patch);
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ section: updated });
}
