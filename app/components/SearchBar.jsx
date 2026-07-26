'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// Client-side search over the handbook sections. `index` is [{key,title,group,text}].
export default function SearchBar({ index }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const out = [];
    for (const s of index) {
      const hay = `${s.title}\n${s.text}`.toLowerCase();
      const idx = hay.indexOf(term);
      if (idx === -1) continue;
      const titleHit = s.title.toLowerCase().includes(term);
      let snippet = '';
      const bodyIdx = s.text.toLowerCase().indexOf(term);
      if (bodyIdx !== -1) {
        const start = Math.max(0, bodyIdx - 40);
        snippet = (start > 0 ? '…' : '') + s.text.slice(start, bodyIdx + term.length + 60).trim() + '…';
      }
      out.push({ ...s, snippet, score: titleHit ? 0 : 1 });
    }
    return out.sort((a, b) => a.score - b.score).slice(0, 8);
  }, [q, index]);

  function go(key) {
    setOpen(false);
    setQ('');
    const el = document.getElementById(key);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', `#${key}`);
  }

  return (
    <div className="search-wrap" ref={ref}>
      <input
        className="search-input"
        type="text"
        value={q}
        placeholder="Search the handbook…"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        aria-label="Search the handbook"
      />
      {open && q.trim().length >= 2 && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">No matches for “{q}”.</div>
          ) : (
            results.map((r) => (
              <a key={r.key} href={`#${r.key}`} onClick={(e) => { e.preventDefault(); go(r.key); }}>
                <div className="sr-grp">{r.group}</div>
                <div className="sr-title">{r.title}</div>
                {r.snippet && <div className="sr-snip">{r.snippet}</div>}
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
