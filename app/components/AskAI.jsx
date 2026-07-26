'use client';

import { useRef, useState } from 'react';

// Floating "Ask" chat. Posts questions to /api/ask (Claude, grounded in the
// handbook) and renders the answer plus a jump link to the relevant section.
export default function AskAI({ code }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  function scrollDown() {
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    });
  }

  async function send(e) {
    e?.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);
    scrollDown();
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setMessages((m) => [...m, { role: 'bot', text: data.answer, sectionKey: data.sectionKey, sectionTitle: data.sectionTitle }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'bot', text: err.message || 'Sorry, I couldn’t answer that right now.' }]);
    } finally {
      setBusy(false);
      scrollDown();
    }
  }

  function jump(key) {
    const el = document.getElementById(key);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', `#${key}`);
  }

  if (!open) {
    return (
      <button className="chat-fab no-print" onClick={() => setOpen(true)} aria-label="Ask a question">
        <span aria-hidden>✦</span> Ask
      </button>
    );
  }

  return (
    <div className="chat-panel no-print" role="dialog" aria-label="Ask the handbook">
      <div className="chat-head">
        <span aria-hidden>✦</span>
        <span className="t">Ask the <span className="accent">Handbook</span></span>
        <button onClick={() => setOpen(false)} aria-label="Close">×</button>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <p className="chat-hint">
            Ask anything — “What time is drop-off?”, “What’s the cell phone policy?” — and I’ll answer and
            point you to the right section.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <div className="bubble">
              {m.text}
              {m.sectionKey && (
                <a
                  className="jump"
                  href={`#${m.sectionKey}`}
                  onClick={(e) => { e.preventDefault(); jump(m.sectionKey); }}
                >
                  Go to “{m.sectionTitle || 'section'}” →
                </a>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="chat-msg bot"><div className="bubble typing">Thinking…</div></div>}
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          aria-label="Your question"
        />
        <button type="submit" disabled={busy || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
