import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@/lib/store';
import { resolveHandbook } from '@/lib/resolve';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string', description: 'A warm, concise answer (1–3 sentences) drawn only from the handbook.' },
    section_key: { type: 'string', description: 'The key of the single most relevant handbook section, or an empty string if none fits.' },
  },
  required: ['answer', 'section_key'],
};

// Ask a question about a location's handbook. Grounded in the resolved handbook
// content and answered by Claude; returns the answer plus a section to jump to.
export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The assistant isn’t set up yet. An admin needs to add an ANTHROPIC_API_KEY.' },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').trim();
  const question = String(body.question || '').trim();
  if (!code || !question) {
    return NextResponse.json({ error: 'Missing code or question.' }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: 'Please keep questions short.' }, { status: 400 });
  }

  const store = getStore();
  const location = await store.getLocationByCode(code);
  if (!location) return NextResponse.json({ error: 'Unknown campus code.' }, { status: 404 });

  const sections = await store.listSections();
  const { sections: resolved } = resolveHandbook(sections, location);

  const handbookText = resolved
    .map((s) => `## [${s.key}] ${s.title}\n${s.body}`)
    .join('\n\n');
  const keyList = resolved.map((s) => s.key).join(', ');

  const system = [
    {
      type: 'text',
      text:
        `You are a warm, helpful assistant for the ${location.name} campus of Alpha School. ` +
        `Answer parents' and families' questions using ONLY the handbook content provided. ` +
        `Be concise (1–3 sentences) and friendly. If the answer isn't in the handbook, say you're not sure ` +
        `and suggest contacting the Campus Coordinator via ParentSquare. ` +
        `Always choose the single most relevant section for the reader to open next: set "section_key" to one of ` +
        `these exact keys — ${keyList} — or an empty string if none fits.`,
    },
    {
      type: 'text',
      text: `HANDBOOK CONTENT for ${location.name} (${location.code}):\n\n${handbookText}`,
      cache_control: { type: 'ephemeral' },
    },
  ];

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system,
      messages: [{ role: 'user', content: question }],
    });

    if (resp.stop_reason === 'refusal') {
      return NextResponse.json({
        answer: "I'm not able to answer that one — please reach out to your Campus Coordinator via ParentSquare.",
        sectionKey: null,
      });
    }

    const textBlock = resp.content.find((b) => b.type === 'text');
    let parsed = { answer: '', section_key: '' };
    try {
      parsed = JSON.parse(textBlock?.text || '{}');
    } catch {
      parsed = { answer: textBlock?.text || 'Sorry, I couldn’t find that.', section_key: '' };
    }

    const key = parsed.section_key && resolved.some((s) => s.key === parsed.section_key) ? parsed.section_key : null;
    const sectionTitle = key ? resolved.find((s) => s.key === key)?.title : null;

    return NextResponse.json({
      answer: parsed.answer || 'Sorry, I couldn’t find that in the handbook.',
      sectionKey: key,
      sectionTitle,
    });
  } catch (e) {
    const status = e?.status || 500;
    const msg = status === 401 ? 'The assistant’s API key is invalid.' : 'The assistant is unavailable right now. Please try again.';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
