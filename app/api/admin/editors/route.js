import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor, isSuper } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isSuper(editor)) return NextResponse.json({ error: 'Superadmins only.' }, { status: 403 });
  return NextResponse.json({ editors: await getStore().listEditors() });
}

// Add or update an editor. Only superadmins manage editors and assign roles.
export async function POST(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isSuper(editor)) return NextResponse.json({ error: 'Superadmins only.' }, { status: 403 });

  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  const role = body.role === 'super' ? 'super' : 'location';
  const locations = Array.isArray(body.locations)
    ? body.locations.map((c) => String(c).trim().toLowerCase()).filter(Boolean)
    : [];
  if (role === 'location' && locations.length === 0) {
    return NextResponse.json({ error: 'Assign at least one campus to a location editor.' }, { status: 400 });
  }
  await getStore().addEditor(email, editor.email, role, role === 'super' ? [] : locations);
  return NextResponse.json({ editors: await getStore().listEditors() });
}

export async function DELETE(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isSuper(editor)) return NextResponse.json({ error: 'Superadmins only.' }, { status: 403 });

  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  if (email === editor.email) {
    return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 });
  }
  await getStore().removeEditor(email);
  return NextResponse.json({ editors: await getStore().listEditors() });
}
