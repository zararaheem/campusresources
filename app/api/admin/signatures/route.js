import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, isSuper } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// List signed forms for review. Superadmins see all campuses; a campus DOP
// sees only the campuses assigned to them.
export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const store = getStore();
  let rows = await store.listSignatures();

  if (!isSuper(editor)) {
    const allowed = new Set(editor.locations || []);
    rows = rows.filter((r) => allowed.has(r.location_code));
  }

  return NextResponse.json({ signatures: rows });
}
