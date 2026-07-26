'use client';

import { useEffect, useMemo, useState } from 'react';

const PLACEHOLDER_RE = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function placeholdersInSections(sections) {
  const keys = new Set();
  for (const s of sections) {
    let m;
    PLACEHOLDER_RE.lastIndex = 0;
    while ((m = PLACEHOLDER_RE.exec(s.body || '')) !== null) keys.add(m[1]);
  }
  return keys;
}

export default function AdminApp({ editorEmail, dev, signOutAction }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('locations');
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  async function reload() {
    try {
      const d = await api('GET', '/api/admin/bootstrap');
      setData(d);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (error) {
    return (
      <div className="admin-wrap">
        <div className="card">
          <h3>Could not load</h3>
          <p className="hint">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="admin-wrap"><p className="muted">Loading…</p></div>;
  }

  return (
    <>
      <div className="admin-top">
        <span className="brand">Handbook Editor</span>
        {!data.persistent && (
          <span className="badge warn" title="Set Supabase env vars for persistent, shared storage">
            local preview — changes are not shared
          </span>
        )}
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 13 }}>{editorEmail}</span>
        <a className="btn ghost small" href="/" target="_blank" rel="noreferrer">View site</a>
        {!dev && (
          <form action={signOutAction}>
            <button className="btn ghost small" type="submit">Sign out</button>
          </form>
        )}
      </div>

      <div className="admin-wrap">
        <div className="tabs">
          <button className={`tab ${tab === 'locations' ? 'active' : ''}`} onClick={() => setTab('locations')}>
            Locations
          </button>
          <button className={`tab ${tab === 'sections' ? 'active' : ''}`} onClick={() => setTab('sections')}>
            Default Handbook
          </button>
          <button className={`tab ${tab === 'editors' ? 'active' : ''}`} onClick={() => setTab('editors')}>
            Editors
          </button>
        </div>

        {tab === 'locations' && <LocationsTab data={data} reload={reload} flash={flash} />}
        {tab === 'sections' && <SectionsTab data={data} reload={reload} flash={flash} />}
        {tab === 'editors' && <EditorsTab data={data} reload={reload} flash={flash} editorEmail={editorEmail} />}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

/* ─────────────────────────── Locations ─────────────────────────── */
function LocationsTab({ data, reload, flash }) {
  const { locations, fieldDefs, sections } = data;
  const [selectedId, setSelectedId] = useState(locations[0]?.id || null);
  const [creating, setCreating] = useState(false);

  const selected = locations.find((l) => l.id === selectedId) || null;

  return (
    <>
      <div className="card">
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Campus edition</label>
            <select value={selectedId || ''} onChange={(e) => { setSelectedId(e.target.value); setCreating(false); }}>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.code}{l.is_active ? '' : ' (hidden)'}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" onClick={() => setCreating(true)}>+ New location</button>
        </div>
      </div>

      {creating && <NewLocationCard fieldDefs={fieldDefs} locations={locations} onDone={async (id) => { await reload(); setSelectedId(id); setCreating(false); }} onCancel={() => setCreating(false)} flash={flash} />}

      {!creating && selected && (
        <LocationEditor key={selected.id} location={selected} fieldDefs={fieldDefs} sections={sections} reload={reload} flash={flash} />
      )}
    </>
  );
}

function NewLocationCard({ fieldDefs, locations, onDone, onCancel, flash }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [edition, setEdition] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const src = locations.find((l) => l.id === copyFrom);
      const fields = src ? { ...src.fields } : {};
      const { location } = await api('POST', '/api/admin/locations', { code, name, edition, fields });
      flash('Location created');
      onDone(location.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h3>New location</h3>
      <p className="hint">A location is one campus edition, opened with its code at <code>/?code=…</code></p>
      <div className="row">
        <div className="field">
          <label>Code <span className="ex">e.g. austin-2026</span></label>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="austin-2026" />
        </div>
        <div className="field">
          <label>Campus name <span className="ex">e.g. Austin</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Austin" />
        </div>
        <div className="field">
          <label>Edition label <span className="ex">e.g. 2026</span></label>
          <input type="text" value={edition} onChange={(e) => setEdition(e.target.value)} placeholder="2026" />
        </div>
      </div>
      <div className="field">
        <label>Start from <span className="ex">optional — copy field values from another campus</span></label>
        <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
          <option value="">Blank (fill in fresh)</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.code}</option>)}
        </select>
      </div>
      {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
      <div className="row">
        <button className="btn" disabled={busy} onClick={create}>Create location</button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function LocationEditor({ location, fieldDefs, sections, reload, flash }) {
  const [name, setName] = useState(location.name);
  const [code, setCode] = useState(location.code);
  const [edition, setEdition] = useState(location.edition || '');
  const [academicYear, setAcademicYear] = useState(location.academic_year || '');
  const [active, setActive] = useState(location.is_active !== false);
  const [fields, setFields] = useState({ ...location.fields });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const usedKeys = useMemo(() => placeholdersInSections(sections), [sections]);
  const missing = useMemo(
    () => [...usedKeys].filter((k) => !fields[k] || String(fields[k]).trim() === ''),
    [usedKeys, fields]
  );

  const groups = useMemo(() => {
    const g = [];
    for (const f of fieldDefs) {
      let grp = g.find((x) => x.name === f.group);
      if (!grp) { grp = { name: f.group, fields: [] }; g.push(grp); }
      grp.fields.push(f);
    }
    return g;
  }, [fieldDefs]);

  async function saveDetails() {
    setBusy(true); setErr(null);
    try {
      await api('PATCH', `/api/admin/locations/${location.id}`, { name, code, edition, is_active: active, academic_year: academicYear });
      flash('Saved');
      await reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  async function saveFields() {
    setBusy(true); setErr(null);
    try {
      await api('PATCH', `/api/admin/locations/${location.id}`, { fields });
      flash('Campus details saved');
      await reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm(`Delete ${location.name} (${location.code})? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api('DELETE', `/api/admin/locations/${location.id}`);
      flash('Location deleted');
      await reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="card">
        <h3>{location.name} <span className="muted mono" style={{ fontSize: 14 }}>· {location.code}</span></h3>
        <p className="hint">
          Opens at <a href={`/?code=${location.code}`} target="_blank" rel="noreferrer">/?code={location.code}</a>
        </p>
        <div className="row">
          <div className="field"><label>Campus name</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>Code</label><input className="mono" value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <div className="field"><label>Edition label</label><input value={edition} onChange={(e) => setEdition(e.target.value)} /></div>
          <div className="field"><label>Academic year <span className="ex">e.g. 2026–2027</span></label><input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} /></div>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={active} onChange={(e) => setActive(e.target.checked)} />
          Published (uncheck to take this code offline)
        </label>
        {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn" disabled={busy} onClick={saveDetails}>Save details</button>
          <button className="btn danger" disabled={busy} onClick={remove}>Delete location</button>
        </div>
      </div>

      <div className="card">
        <h3>Campus details</h3>
        <p className="hint">These values fill in the handbook for this campus. {missing.length === 0
          ? <span className="badge ok">all fields set</span>
          : <span className="badge warn">{missing.length} still to fill in</span>}
        </p>
        {groups.map((g) => (
          <div key={g.name} style={{ marginBottom: 18 }}>
            <h4 style={{ margin: '10px 0 8px', fontSize: 14 }}>{g.name}</h4>
            {g.fields.map((f) => {
              const isMissing = usedKeys.has(f.key) && (!fields[f.key] || String(fields[f.key]).trim() === '');
              return (
                <div className="field" key={f.key}>
                  <label>
                    {f.label} {isMissing && <span className="badge warn">needed</span>}
                    {f.example && <span className="ex"> — e.g. {f.example.split('\n')[0]}</span>}
                  </label>
                  {f.multiline
                    ? <textarea style={{ minHeight: 70 }} value={fields[f.key] || ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
                    : <input value={fields[f.key] || ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />}
                </div>
              );
            })}
          </div>
        ))}
        <button className="btn" disabled={busy} onClick={saveFields}>Save campus details</button>
      </div>

      <OverridesCard location={location} sections={sections} reload={reload} flash={flash} />
      <CalendarEditorCard location={location} reload={reload} flash={flash} />
    </>
  );
}

function CalendarEditorCard({ location, reload, flash }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(JSON.stringify(location.calendar || [], null, 2));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const count = Array.isArray(location.calendar) ? location.calendar.length : 0;

  async function save() {
    setErr(null);
    let parsed;
    try {
      parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Must be a JSON array of events.');
    } catch (e) {
      setErr('Invalid JSON: ' + e.message);
      return;
    }
    setBusy(true);
    try {
      await api('PATCH', `/api/admin/locations/${location.id}`, { calendar: parsed });
      flash('Calendar saved');
      await reload();
      setOpen(false);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <div className="list-row" style={{ borderBottom: open ? '1px solid var(--line)' : 'none', paddingBottom: open ? 12 : 0 }}>
        <span className="grow"><strong>Calendar</strong> <span className="muted">· {count} event{count === 1 ? '' : 's'}</span></span>
        <a className="btn ghost small" href={`/calendar?code=${location.code}`} target="_blank" rel="noreferrer">Preview</a>
        <button className="btn ghost small" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Edit'}</button>
      </div>
      {open && (
        <div className="section-editor" style={{ paddingTop: 14 }}>
          <p className="hint">
            Each event: <code>{'{ "date": "2026-09-08", "title": "First Day", "category": "session" }'}</code>.
            Add <code>"end": "2026-09-18"</code> for multi-day. Categories: session, holiday, testing, dismissal, staff.
          </p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className="mono" />
          {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
          <button className="btn" disabled={busy} onClick={save}>Save calendar</button>
        </div>
      )}
    </div>
  );
}

function OverridesCard({ location, sections, reload, flash }) {
  const [openKey, setOpenKey] = useState(null);
  const overrides = location.overrides || {};

  return (
    <div className="card">
      <h3>Section overrides</h3>
      <p className="hint">
        Every campus shares the default handbook. Override a section only when this campus needs
        different wording. Cleared overrides fall back to the default.
      </p>
      {sections.map((s) => {
        const ov = overrides[s.key] || {};
        const isOverridden = ov.body != null || ov.title != null || ov.hidden;
        return (
          <div key={s.key}>
            <div className="list-row">
              <span className="grow">
                {s.title}{' '}
                {ov.hidden ? <span className="badge warn">hidden here</span> : isOverridden ? <span className="badge edit">overridden</span> : null}
              </span>
              <button className="btn ghost small" onClick={() => setOpenKey(openKey === s.key ? null : s.key)}>
                {openKey === s.key ? 'Close' : isOverridden ? 'Edit override' : 'Override'}
              </button>
            </div>
            {openKey === s.key && (
              <OverrideEditor
                location={location}
                section={s}
                current={ov}
                onSaved={async () => { await reload(); setOpenKey(null); }}
                flash={flash}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OverrideEditor({ location, section, current, onSaved, flash }) {
  const [title, setTitle] = useState(current.title || '');
  const [body, setBody] = useState(current.body != null ? current.body : '');
  const [hidden, setHidden] = useState(!!current.hidden);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api('POST', `/api/admin/locations/${location.id}/override`, {
        sectionKey: section.key,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        hidden: hidden || undefined,
      });
      flash('Override saved');
      onSaved();
    } finally { setBusy(false); }
  }

  async function clear() {
    setBusy(true);
    try {
      await api('POST', `/api/admin/locations/${location.id}/override`, { sectionKey: section.key });
      flash('Reverted to default');
      onSaved();
    } finally { setBusy(false); }
  }

  return (
    <div style={{ padding: '4px 0 16px' }}>
      <div className="field">
        <label>Title override <span className="ex">leave blank to keep the default title</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={section.title} />
      </div>
      <div className="field section-editor">
        <label>Body override (Markdown) <span className="ex">leave blank to keep the default body below</span></label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={section.body} />
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginBottom: 12 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Hide this section for {location.name}
      </label>
      <div className="row">
        <button className="btn" disabled={busy} onClick={save}>Save override</button>
        <button className="btn ghost" disabled={busy} onClick={clear}>Revert to default</button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Default sections ─────────────────────────── */
function SectionsTab({ data, reload, flash }) {
  const { sections, groups } = data;
  return (
    <>
      <div className="card">
        <h3>Default Handbook</h3>
        <p className="hint">
          This is the one handbook every campus shares. Edits here apply everywhere. Use
          <code>{'{{field_key}}'}</code> placeholders for anything that differs by campus (they get
          filled from each location&apos;s campus details).
        </p>
      </div>
      {groups.map((groupName) => (
        <div key={groupName}>
          <h4 style={{ margin: '18px 4px 8px', color: 'var(--ink-soft)' }}>{groupName}</h4>
          {sections.filter((s) => (s.group_name || '') === groupName).map((s) => (
            <SectionEditor key={s.key} section={s} reload={reload} flash={flash} />
          ))}
        </div>
      ))}
    </>
  );
}

function SectionEditor({ section, reload, flash }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [body, setBody] = useState(section.body);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api('PATCH', `/api/admin/sections/${section.key}`, { title, body });
      flash('Section saved');
      await reload();
      setOpen(false);
    } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <div className="list-row" style={{ borderBottom: open ? '1px solid var(--line)' : 'none', paddingBottom: open ? 12 : 0 }}>
        <span className="grow"><strong>{section.title}</strong> <span className="muted mono" style={{ fontSize: 12 }}>{section.key}</span></span>
        <button className="btn ghost small" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Edit'}</button>
      </div>
      {open && (
        <div className="section-editor" style={{ paddingTop: 14 }}>
          <div className="field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field"><label>Body (Markdown)</label><textarea value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <button className="btn" disabled={busy} onClick={save}>Save section</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Editors ─────────────────────────── */
function EditorsTab({ data, reload, flash, editorEmail }) {
  const { editors } = data;
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function add() {
    setBusy(true); setErr(null);
    try {
      await api('POST', '/api/admin/editors', { email });
      setEmail('');
      flash('Editor added');
      await reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  async function remove(target) {
    if (!confirm(`Remove ${target}? They will lose editing access.`)) return;
    setBusy(true); setErr(null);
    try {
      await api('DELETE', '/api/admin/editors', { email: target });
      flash('Editor removed');
      await reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h3>Editors</h3>
      <p className="hint">Only these Google accounts can sign in to edit the handbook and manage locations.</p>
      {editors.map((e) => (
        <div className="list-row" key={e.email}>
          <span className="grow">{e.email} {e.email === editorEmail && <span className="badge ok">you</span>}</span>
          <span className="muted" style={{ fontSize: 12 }}>{e.added_by ? `added by ${e.added_by}` : ''}</span>
          {e.email !== editorEmail && <button className="btn ghost small" onClick={() => remove(e.email)}>Remove</button>}
        </div>
      ))}
      <div className="row" style={{ marginTop: 16 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Add an editor by email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@alpha.school" />
        </div>
        <button className="btn" disabled={busy} onClick={add}>Add editor</button>
      </div>
      {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
    </div>
  );
}
