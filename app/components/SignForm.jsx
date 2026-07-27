'use client';

import { useState } from 'react';
import AlphaLogo from './AlphaLogo';

// "Sign this form" button + modal for a signable section. Submissions are
// stored for the campus team to review in /admin.
export default function SignForm({ code, sectionKey, sectionTitle, bodyHtml }) {
  const [open, setOpen] = useState(false);
  const [parentName, setParentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);

  function reset() {
    setParentName(''); setStudentName(''); setSignature(''); setAgreed(false); setErr(null); setDone(false);
  }
  function close() { setOpen(false); reset(); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, sectionKey, sectionTitle, parentName, studentName, signature, agreed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not submit. Please try again.');
      }
      setDone(true);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <>
      <button type="button" className="sign-btn no-print" onClick={() => setOpen(true)}>
        Review &amp; sign this form
      </button>

      {open && (
        <div className="sign-overlay no-print" role="dialog" aria-modal="true" onClick={close}>
          <div className="sign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sign-head">
              <AlphaLogo size={22} />
              <button className="sign-close" onClick={close} aria-label="Close">×</button>
            </div>

            {done ? (
              <div className="sign-body">
                <h3 style={{ marginTop: 0 }}>Thank you — received</h3>
                <p className="hint">Your signature for <strong>{sectionTitle}</strong> has been submitted to the campus team.</p>
                <button className="btn" onClick={close}>Done</button>
              </div>
            ) : (
              <form className="sign-body" onSubmit={submit}>
                <p className="sign-eyebrow">Review &amp; sign</p>
                <h3 style={{ margin: '2px 0 4px' }}>{sectionTitle}</h3>

                {bodyHtml && (
                  <div className="sign-contract prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                )}

                <p className="hint">Complete the fields below to sign. It will be sent to your campus team.</p>

                <div className="field"><label>Parent / Guardian name</label>
                  <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Full name" /></div>
                <div className="field"><label>Student name</label>
                  <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Student's full name" /></div>
                <div className="field"><label>Signature <span className="ex">type your full name to sign</span></label>
                  <input className="sign-input" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Your signature" /></div>

                <label className="sign-agree">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <span>I have read <strong>{sectionTitle}</strong> and agree to it on behalf of my family.</span>
                </label>

                {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
                <div className="row">
                  <button className="btn" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit signature'}</button>
                  <button className="btn ghost" type="button" onClick={close}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
