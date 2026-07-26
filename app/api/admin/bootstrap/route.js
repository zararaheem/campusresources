import { NextResponse } from 'next/server';
import { getStore, usingSupabase } from '@/lib/store';
import { getCurrentEditor } from '@/lib/auth-helpers';
import { FIELD_DEFS, SECTION_GROUPS } from '@/lib/seed';

export const dynamic = 'force-dynamic';

// Single call that hydrates the admin UI.
export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const store = getStore();
  const [sections, locations, editors] = await Promise.all([
    store.listSections(),
    store.listLocations(),
    store.listEditors(),
  ]);

  return NextResponse.json({
    editor,
    driver: store.driver,
    persistent: usingSupabase(),
    fieldDefs: FIELD_DEFS,
    groups: SECTION_GROUPS,
    sections,
    locations,
    editors,
  });
}
