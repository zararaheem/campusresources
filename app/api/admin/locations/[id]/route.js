import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, isSuper } from '@/lib/auth-helpers';
import { CALENDAR_TEMPLATES } from '@/lib/seed';

export const dynamic = 'force-dynamic';

const CODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Update a location (name, code, fields, calendar, template…). Superadmins
// only — location DOPs edit their campus via section overrides instead.
export async function PATCH(req, { params }) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isSuper(editor)) return NextResponse.json({ error: 'Superadmins only.' }, { status: 403 });

  const body = await req.json();
  const patch = {};
  // Applying a calendar template copies its dates in.
  if (body.calendar_template !== undefined) {
    const tpl = CALENDAR_TEMPLATES[body.calendar_template];
    patch.calendar_template = String(body.calendar_template);
    if (tpl && body.applyTemplate) {
      patch.sessions = tpl.sessions;
      patch.calendar = tpl.events;
    }
  }
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.edition !== undefined) patch.edition = String(body.edition).trim();
  if (body.is_active !== undefined) patch.is_active = !!body.is_active;
  if (body.fields !== undefined && typeof body.fields === 'object') patch.fields = body.fields;
  if (body.academic_year !== undefined) patch.academic_year = String(body.academic_year).trim();
  if (body.calendar !== undefined) {
    if (!Array.isArray(body.calendar)) {
      return NextResponse.json({ error: 'Calendar must be a list of events.' }, { status: 400 });
    }
    patch.calendar = body.calendar;
  }
  if (body.sessions !== undefined) {
    if (!Array.isArray(body.sessions)) {
      return NextResponse.json({ error: 'Sessions must be a list.' }, { status: 400 });
    }
    patch.sessions = body.sessions;
  }
  if (body.code !== undefined) {
    const code = String(body.code).trim().toLowerCase();
    if (!CODE_RE.test(code)) {
      return NextResponse.json({ error: 'Invalid code format.' }, { status: 400 });
    }
    patch.code = code;
  }

  try {
    const { id } = await params;
    const updated = await getStore().updateLocation(id, patch);
    if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ location: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Could not update location.' }, { status: 400 });
  }
}

export async function DELETE(_req, { params }) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isSuper(editor)) return NextResponse.json({ error: 'Superadmins only.' }, { status: 403 });
  const { id } = await params;
  await getStore().deleteLocation(id);
  return NextResponse.json({ ok: true });
}
