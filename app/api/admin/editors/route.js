import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function GET() {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ editors: await getStore().listEditors() });
}

// Add someone to the allowlist. Only existing editors can do this.
export async function POST(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  await getStore().addEditor(email, editor.email);
  return NextResponse.json({ editors: await getStore().listEditors() });
}

export async function DELETE(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  if (email === editor.email) {
    return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 });
  }
  await getStore().removeEditor(email);
  return NextResponse.json({ editors: await getStore().listEditors() });
}
