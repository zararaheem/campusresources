import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

// Public endpoint: a family submits a signature for a signable section.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').trim();
  const sectionKey = String(body.sectionKey || '').trim();
  const parentName = String(body.parentName || '').trim();
  const studentName = String(body.studentName || '').trim();
  const signature = String(body.signature || '').trim();

  if (!code || !sectionKey) {
    return NextResponse.json({ error: 'Missing form details.' }, { status: 400 });
  }
  if (!parentName || !signature) {
    return NextResponse.json({ error: 'Please enter your name and signature.' }, { status: 400 });
  }
  if (!body.agreed) {
    return NextResponse.json({ error: 'Please check the box to agree.' }, { status: 400 });
  }

  const store = getStore();
  const loc = await store.getLocationByCode(code);
  if (!loc) return NextResponse.json({ error: 'Unknown campus code.' }, { status: 404 });

  const row = await store.addSignature({
    location_code: code,
    section_key: sectionKey,
    section_title: String(body.sectionTitle || '').slice(0, 200) || sectionKey,
    parent_name: parentName.slice(0, 200),
    student_name: studentName.slice(0, 200),
    signature: signature.slice(0, 200),
    agreed: true,
    user_agent: String(req.headers.get('user-agent') || '').slice(0, 300),
  });

  return NextResponse.json({ ok: true, id: row?.id || null });
}
