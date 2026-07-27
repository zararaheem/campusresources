import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, canEditLocation } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

// Add or update a per-location section (e.g. a state-specific policy).
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

  // Reorder: body.reorder is the full list of keys in the desired order.
  if (Array.isArray(body.reorder)) {
    const current = Array.isArray(loc.extra_sections) ? loc.extra_sections : [];
    const byKey = new Map(current.map((s) => [s.key, s]));
    const reordered = body.reorder.map((k) => byKey.get(k)).filter(Boolean);
    // Append any sections not named in the reorder list (safety).
    for (const s of current) if (!body.reorder.includes(s.key)) reordered.push(s);
    const updated = await getStore().updateLocation(id, { extra_sections: reordered });
    return NextResponse.json({ location: updated });
  }

  const title = String(body.title || '').trim();
  if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  const group = String(body.group || 'Policies').trim() || 'Policies';
  const text = String(body.body || '');

  const list = Array.isArray(loc.extra_sections) ? [...loc.extra_sections] : [];
  let key = body.key ? String(body.key) : '';
  if (key) {
    const idx = list.findIndex((s) => s.key === key);
    if (idx >= 0) list[idx] = { ...list[idx], title, group, body: text };
    else list.push({ key, title, group, body: text });
  } else {
    key = slugify(title) || `section-${list.length + 1}`;
    // avoid colliding with an existing extra key
    let unique = key, n = 2;
    while (list.some((s) => s.key === unique)) unique = `${key}-${n++}`;
    list.push({ key: unique, title, group, body: text });
  }

  const updated = await getStore().updateLocation(id, { extra_sections: list });
  return NextResponse.json({ location: updated });
}

export async function DELETE(req, { params }) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const loc = await getStore().getLocation(id);
  if (!loc) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!canEditLocation(editor, loc.code)) {
    return NextResponse.json({ error: 'You can only edit your assigned campus.' }, { status: 403 });
  }

  const body = await req.json();
  const key = String(body.key || '');
  const list = (Array.isArray(loc.extra_sections) ? loc.extra_sections : []).filter((s) => s.key !== key);
  const updated = await getStore().updateLocation(id, { extra_sections: list });
  return NextResponse.json({ location: updated });
}
