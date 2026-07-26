import { NextResponse } from 'next/server';
import { getStore, usingSupabase } from '@/lib/store';
import { getCurrentEditor, isSuper } from '@/lib/auth-helpers';
import { FIELD_DEFS, SECTION_GROUPS, CALENDAR_TEMPLATES } from '@/lib/seed';

export const dynamic = 'force-dynamic';

// Single call that hydrates the admin UI, scoped to the editor's role.
export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const store = getStore();
  const superUser = isSuper(editor);

  const [sections, allLocations, editors] = await Promise.all([
    store.listSections(),
    store.listLocations(),
    superUser ? store.listEditors() : Promise.resolve([]),
  ]);

  // Location DOPs only see their assigned campuses.
  const locations = superUser
    ? allLocations
    : allLocations.filter((l) => (editor.locations || []).includes(l.code));

  // Template list (name + key only) for the New Location picker.
  const templates = Object.entries(CALENDAR_TEMPLATES).map(([key, t]) => ({
    key,
    name: t.name,
    description: t.description,
  }));

  return NextResponse.json({
    editor,
    driver: store.driver,
    persistent: usingSupabase(),
    fieldDefs: FIELD_DEFS,
    groups: SECTION_GROUPS,
    templates,
    sections,
    locations,
    editors,
  });
}
