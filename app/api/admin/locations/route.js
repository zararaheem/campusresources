import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getCurrentEditor } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const CODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Create a new campus edition (a new code).
export async function POST(req) {
  const editor = await getCurrentEditor();
  if (!editor) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const code = String(body.code || '').trim().toLowerCase();
  if (!CODE_RE.test(code)) {
    return NextResponse.json(
      { error: 'Code must be lowercase letters, numbers, and dashes (e.g. austin-2026).' },
      { status: 400 }
    );
  }
  try {
    const loc = await getStore().createLocation({
      code,
      name: String(body.name || '').trim() || code,
      edition: String(body.edition || '').trim(),
      fields: body.fields && typeof body.fields === 'object' ? body.fields : {},
    });
    return NextResponse.json({ location: loc });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Could not create location.' }, { status: 400 });
  }
}
