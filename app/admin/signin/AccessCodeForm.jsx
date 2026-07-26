'use client';

import { useState } from 'react';

// Temporary code login while Google OAuth is being set up.
export default function AccessCodeForm() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Incorrect access code.');
      }
      window.location.href = '/admin';
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px' }}>
        <span style={{ flex: 1, height: 1, background: 'var(--line, #e6e9f0)' }} />
        <span style={{ fontSize: 12, color: 'var(--ink-mute, #7b8598)' }}>or use an access code</span>
        <span style={{ flex: 1, height: 1, background: 'var(--line, #e6e9f0)' }} />
      </div>
      <input
        type="password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Editor access code"
        autoComplete="off"
        style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid #d9d0bd', fontSize: 15 }}
      />
      {err && <p style={{ color: 'var(--danger, #c0392b)', fontSize: 13, marginTop: 8 }}>{err}</p>}
      <button className="btn" type="submit" disabled={busy} style={{ marginTop: 12, width: '100%' }}>
        {busy ? 'Checking…' : 'Enter editor'}
      </button>
    </form>
  );
}
