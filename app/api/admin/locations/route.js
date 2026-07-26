import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, isSuper } from '@/lib/auth-helpers';
import { CALENDAR_TEMPLATES } from '@/lib/seed';

export const dynamic = 'force-dynamic';

const CODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Create a new campus edition (a new code). Superadmins only.
export async function POST(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isSuper(editor)) return NextResponse.json({ error: 'Superadmins only.' }, { status: 403 });

  const body = await req.json();
  const code = String(body.code || '').trim().toLowerCase();
  if (!CODE_RE.test(code)) {
    return NextResponse.json(
      { error: 'Code must be lowercase letters, numbers, and dashes (e.g. austin-2026).' },
      { status: 400 }
    );
  }
  try {
    const store = getStore();
    let loc = await store.createLocation({
      code,
      name: String(body.name || '').trim() || code,
      edition: String(body.edition || '').trim(),
      fields: body.fields && typeof body.fields === 'object' ? body.fields : {},
    });
    // Apply a calendar template (A/B) if chosen — copies its sessions + dates.
    const tpl = CALENDAR_TEMPLATES[body.calendar_template];
    if (tpl) {
      loc = await store.updateLocation(loc.id, {
        calendar_template: body.calendar_template,
        sessions: tpl.sessions,
        calendar: tpl.events,
      });
    }
    return NextResponse.json({ location: loc });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Could not create location.' }, { status: 400 });
  }
}
