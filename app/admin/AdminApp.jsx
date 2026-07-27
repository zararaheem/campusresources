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

  const superUser = data.editor?.role === 'super';
  const activeTab = superUser ? tab : (tab === 'signatures' ? 'signatures' : 'locations');

  return (
    <>
      <div className="admin-top">
        <span className="brand">Handbook Editor</span>
        <span className={`badge ${superUser ? 'ok' : 'edit'}`}>
          {superUser ? 'Superadmin' : 'Campus editor'}
        </span>
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
          <button className={`tab ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => setTab('locations')}>Locations</button>
          {superUser && <button className={`tab ${activeTab === 'sections' ? 'active' : ''}`} onClick={() => setTab('sections')}>Shared handbook</button>}
          <button className={`tab ${activeTab === 'signatures' ? 'active' : ''}`} onClick={() => setTab('signatures')}>Signed forms</button>
          {superUser && <button className={`tab ${activeTab === 'editors' ? 'active' : ''}`} onClick={() => setTab('editors')}>Editors</button>}
        </div>
        {!superUser && (
          <p className="hint" style={{ marginBottom: 16 }}>
            You&apos;re a campus editor. Choose which sections appear for your campus and edit their wording —
            changes stay on your campus only.
          </p>
        )}

        {activeTab === 'locations' && <LocationsTab data={data} reload={reload} flash={flash} superUser={superUser} />}
        {activeTab === 'sections' && superUser && <SectionsTab data={data} reload={reload} flash={flash} />}
        {activeTab === 'signatures' && <SignaturesTab />}
        {activeTab === 'editors' && superUser && <EditorsTab data={data} reload={reload} flash={flash} editorEmail={editorEmail} />}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

/* ─────────────────────────── Locations ─────────────────────────── */
function LocationsTab({ data, reload, flash, superUser }) {
  const { locations, fieldDefs, sections, templates } = data;
  const [selectedId, setSelectedId] = useState(locations[0]?.id || null);
  const [creating, setCreating] = useState(false);

  const selected = locations.find((l) => l.id === selectedId) || null;

  if (locations.length === 0) {
    return <div className="card"><h3>No campuses assigned</h3><p className="hint">Ask a superadmin to assign you a campus.</p></div>;
  }

  return (
    <>
      <div className="card">
        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Campus</label>
            <select value={selectedId || ''} onChange={(e) => { setSelectedId(e.target.value); setCreating(false); }}>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.code}{l.is_active ? '' : ' (hidden)'}
                </option>
              ))}
            </select>
          </div>
          {superUser && <button className="btn" onClick={() => setCreating(true)}>+ New location</button>}
        </div>
      </div>

      {selected && (
        <LocationEditor key={selected.id} location={selected} fieldDefs={fieldDefs} sections={sections} templates={templates} reload={reload} flash={flash} superUser={superUser} />
      )}

      {creating && superUser && <NewLocationCard fieldDefs={fieldDefs} locations={locations} templates={templates} onDone={async (id) => { await reload(); setSelectedId(id); setCreating(false); }} onCancel={() => setCreating(false)} flash={flash} />}
    </>
  );
}

function NewLocationCard({ fieldDefs, locations, templates = [], onDone, onCancel, flash }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [edition, setEdition] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  const [template, setTemplate] = useState('A');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function create() {
    setBusy(true);
    setErr(null);
    try {
      const src = locations.find((l) => l.id === copyFrom);
      const fields = src ? { ...src.fields } : {};
      const effCode = (code || (name ? `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}${edition ? '-' + edition.trim() : ''}` : '')).trim();
      if (!name.trim()) { setErr('Campus name is required.'); setBusy(false); return; }
      if (!effCode) { setErr('A web address is required.'); setBusy(false); return; }
      const { location } = await api('POST', '/api/admin/locations', { code: effCode, name, edition, fields, calendar_template: template });
      flash('Location created');
      onDone(location.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const autoCode = code || (name ? `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}${edition ? '-' + edition.trim() : ''}` : '');

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Add a campus</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <p className="hint">Fill in a few basics and we&apos;ll set up the new campus handbook. You can fine-tune everything afterward.</p>
          <div className="row">
            <div className="field" style={{ flex: 2 }}>
              <label>Campus name <span className="ex">e.g. Austin</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Austin" autoFocus />
            </div>
            <div className="field">
              <label>Year <span className="ex">e.g. 2026</span></label>
              <input type="text" value={edition} onChange={(e) => setEdition(e.target.value)} placeholder="2026" />
            </div>
          </div>
          <div className="field">
            <label>Web address <span className="ex">the link families use — edit if you like</span></label>
            <input type="text" className="mono" value={code || autoCode} onChange={(e) => setCode(e.target.value)} placeholder="austin-2026" />
            <p className="hint" style={{ margin: '6px 0 0' }}>Opens at <code>/?code={autoCode || 'campus-2026'}</code></p>
          </div>
          <div className="row">
            <div className="field">
              <label>Calendar <span className="ex">which shared calendar it follows</span></label>
              <select value={template} onChange={(e) => setTemplate(e.target.value)}>
                {templates.map((t) => <option key={t.key} value={t.key}>{t.name} — {t.description}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Copy details from <span className="ex">optional starting point</span></label>
              <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
                <option value="">Start blank</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.code}</option>)}
              </select>
            </div>
          </div>
          {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
          <div className="row" style={{ marginTop: 6 }}>
            <button className="btn" disabled={busy} onClick={create}>{busy ? 'Creating…' : 'Create campus'}</button>
            <button className="btn ghost" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationEditor({ location, fieldDefs, sections, templates = [], reload, flash, superUser }) {
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
      {superUser && (
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
      )}

      {superUser && (
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
      )}

      {!superUser && (
        <div className="card">
          <h3>{location.name} <span className="muted mono" style={{ fontSize: 14 }}>· {location.code}</span></h3>
          <p className="hint">Choose which sections show for your campus and edit their wording below. <a href={`/?code=${location.code}`} target="_blank" rel="noreferrer">View your handbook →</a></p>
        </div>
      )}

      <OverridesCard location={location} sections={sections} reload={reload} flash={flash} />
      <SectionsCard location={location} reload={reload} flash={flash} />
      {superUser && <TemplateCard location={location} templates={templates} reload={reload} flash={flash} />}
      {superUser && <CalendarEditorCard location={location} reload={reload} flash={flash} />}
    </>
  );
}

/* Per-location sections a campus adds for itself (e.g. state-specific policies). */
function SectionsCard({ location, reload, flash }) {
  const list = Array.isArray(location.extra_sections) ? location.extra_sections : [];
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  async function move(index, dir) {
    const j = index + dir;
    if (j < 0 || j >= list.length || busy) return;
    const order = list.map((s) => s.key);
    [order[index], order[j]] = [order[j], order[index]];
    setBusy(true);
    try {
      await api('POST', `/api/admin/locations/${location.id}/sections`, { reorder: order });
      await reload();
    } catch (e) { flash(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h3>Campus sections</h3>
      <p className="hint">
        Sections that appear only on <strong>{location.name}</strong>&apos;s handbook (e.g. state-specific
        policies). They show at the end of whichever group you name (default <code>Policies</code>). Use the
        arrows to reorder them.
      </p>
      {list.length === 0 && <p className="muted" style={{ fontSize: 14 }}>No campus-specific sections yet.</p>}
      {list.map((s, i) => (
        <ExtraSectionRow
          key={s.key}
          location={location}
          section={s}
          reload={reload}
          flash={flash}
          onMoveUp={i > 0 ? () => move(i, -1) : null}
          onMoveDown={i < list.length - 1 ? () => move(i, 1) : null}
        />
      ))}
      {adding ? (
        <ExtraSectionRow location={location} section={null} reload={reload} flash={flash} onDone={() => setAdding(false)} />
      ) : (
        <button className="btn ghost small" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ Add a section</button>
      )}
    </div>
  );
}

function ExtraSectionRow({ location, section, reload, flash, onDone, onMoveUp, onMoveDown }) {
  const isNew = !section;
  const [open, setOpen] = useState(isNew);
  const [title, setTitle] = useState(section?.title || '');
  const [group, setGroup] = useState(section?.group || 'Policies');
  const [body, setBody] = useState(section?.body || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function save() {
    if (!title.trim()) { setErr('Title is required.'); return; }
    setBusy(true); setErr(null);
    try {
      await api('POST', `/api/admin/locations/${location.id}/sections`, { key: section?.key, title, group, body });
      flash(isNew ? 'Section added' : 'Section saved');
      await reload();
      if (onDone) onDone(); else setOpen(false);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm(`Remove "${section.title}" from ${location.name}?`)) return;
    setBusy(true); setErr(null);
    try {
      await api('DELETE', `/api/admin/locations/${location.id}/sections`, { key: section.key });
      flash('Section removed');
      await reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  if (!isNew && !open) {
    return (
      <div className="list-row">
        {(onMoveUp || onMoveDown) && (
          <span className="reorder">
            <button onClick={onMoveUp} disabled={!onMoveUp} aria-label="Move up">▲</button>
            <button onClick={onMoveDown} disabled={!onMoveDown} aria-label="Move down">▼</button>
          </span>
        )}
        <span className="grow"><strong>{section.title}</strong> <span className="muted" style={{ fontSize: 12 }}>· {section.group || 'Policies'}</span></span>
        <button className="btn ghost small" onClick={() => setOpen(true)}>Edit</button>
        <button className="btn ghost small" onClick={remove}>Remove</button>
      </div>
    );
  }

  return (
    <div className="section-editor" style={{ padding: '14px 0', borderTop: '1px solid var(--line)' }}>
      <div className="row">
        <div className="field" style={{ flex: 2 }}><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Standardized Testing" /></div>
        <div className="field" style={{ flex: 1 }}><label>Group <span className="ex">where it appears</span></label><input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Policies" /></div>
      </div>
      <div className="field"><label>Content <span className="ex">formatting: **bold**, - bullet, ### subheading</span></label><textarea style={{ minHeight: 130 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the section content…" /></div>
      {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
      <div className="row">
        <button className="btn" disabled={busy} onClick={save}>{isNew ? 'Add section' : 'Save section'}</button>
        <button className="btn ghost" disabled={busy} onClick={() => (onDone ? onDone() : setOpen(false))}>Cancel</button>
      </div>
    </div>
  );
}

function TemplateCard({ location, templates = [], reload, flash }) {
  const [tpl, setTpl] = useState(location.calendar_template || '');
  const [busy, setBusy] = useState(false);

  async function apply(applyDates) {
    setBusy(true);
    try {
      await api('PATCH', `/api/admin/locations/${location.id}`, { calendar_template: tpl, applyTemplate: applyDates });
      flash(applyDates ? 'Template dates applied' : 'Template label saved');
      await reload();
    } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h3>Calendar template</h3>
      <p className="hint">Pick the shared calendar this campus follows. “Apply dates” copies that template&apos;s sessions and dates into this campus (you can still tweak them afterward).</p>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Template</label>
          <select value={tpl} onChange={(e) => setTpl(e.target.value)}>
            <option value="">— none —</option>
            {templates.map((t) => <option key={t.key} value={t.key}>{t.name} — {t.description}</option>)}
          </select>
        </div>
        <button className="btn" disabled={busy || !tpl} onClick={() => apply(true)}>Apply dates</button>
        <button className="btn ghost" disabled={busy} onClick={() => apply(false)}>Save label only</button>
      </div>
    </div>
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
      <h3>Handbook sections</h3>
      <p className="hint">
        Every campus shares the same handbook. Customize a section only when this campus needs different
        wording — or hide one that doesn&apos;t apply. Anything you don&apos;t touch stays in sync with the shared version.
      </p>
      {sections.map((s) => {
        const ov = overrides[s.key] || {};
        const isOverridden = ov.body != null || ov.title != null || ov.hidden;
        return (
          <div key={s.key}>
            <div className="list-row">
              <span className="grow">
                {s.title}{' '}
                {ov.hidden ? <span className="badge warn">hidden here</span> : isOverridden ? <span className="badge edit">customized</span> : null}
              </span>
              <button className="btn ghost small" onClick={() => setOpenKey(openKey === s.key ? null : s.key)}>
                {openKey === s.key ? 'Close' : isOverridden ? 'Edit' : 'Customize'}
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
        <label>Title for this campus <span className="ex">leave blank to keep the shared title</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={section.title} />
      </div>
      <div className="field section-editor">
        <label>Content for this campus <span className="ex">leave blank to keep the shared wording shown below</span></label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={section.body} />
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginBottom: 12 }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
        Hide this section for {location.name}
      </label>
      <div className="row">
        <button className="btn" disabled={busy} onClick={save}>Save for this campus</button>
        <button className="btn ghost" disabled={busy} onClick={clear}>Reset to shared</button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Default sections ─────────────────────────── */
function SectionsTab({ data, reload, flash }) {
  const { sections, groups } = data;
  const [busy, setBusy] = useState(false);

  // Move a section up/down within its group by swapping positions with its
  // neighbour, then persist both.
  async function move(groupSections, index, dir) {
    const j = index + dir;
    if (j < 0 || j >= groupSections.length || busy) return;
    const a = groupSections[index];
    const b = groupSections[j];
    setBusy(true);
    try {
      await api('PATCH', `/api/admin/sections/${a.key}`, { position: b.position });
      await api('PATCH', `/api/admin/sections/${b.key}`, { position: a.position });
      await reload();
    } catch (e) { flash(e.message); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="card">
        <h3>Shared handbook</h3>
        <p className="hint">
          The one handbook every campus starts from — edits here reach every campus (unless a campus customizes
          a section for itself). Use the arrows to reorder sections; anything in <code>{'{{ }}'}</code> is a
          campus detail that fills in automatically per campus.
        </p>
      </div>
      {groups.map((groupName) => {
        const groupSections = sections.filter((s) => (s.group_name || '') === groupName);
        return (
          <div key={groupName}>
            <div className="admin-group-title">{groupName}</div>
            {groupSections.map((s, i) => (
              <SectionEditor
                key={s.key}
                section={s}
                reload={reload}
                flash={flash}
                onMoveUp={i > 0 ? () => move(groupSections, i, -1) : null}
                onMoveDown={i < groupSections.length - 1 ? () => move(groupSections, i, 1) : null}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

function SectionEditor({ section, reload, flash, onMoveUp, onMoveDown }) {
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
    <div className="card" style={{ marginBottom: 10, padding: '14px 18px' }}>
      <div className="list-row" style={{ padding: 0, borderBottom: open ? '1px solid var(--line)' : 'none', paddingBottom: open ? 12 : 0 }}>
        {(onMoveUp || onMoveDown) && (
          <span className="reorder">
            <button onClick={onMoveUp} disabled={!onMoveUp} aria-label="Move up">▲</button>
            <button onClick={onMoveDown} disabled={!onMoveDown} aria-label="Move down">▼</button>
          </span>
        )}
        <span className="grow"><strong>{section.title}</strong></span>
        <button className="btn ghost small" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Edit'}</button>
      </div>
      {open && (
        <div className="section-editor" style={{ paddingTop: 14 }}>
          <div className="field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field"><label>Content <span className="ex">formatting: **bold**, - bullet, ### subheading</span></label><textarea value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <button className="btn" disabled={busy} onClick={save}>Save section</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Editors ─────────────────────────── */
function EditorsTab({ data, reload, flash, editorEmail }) {
  const { editors, locations } = data;
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('location');
  const [campuses, setCampuses] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  function toggleCampus(code) {
    setCampuses((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  async function add() {
    setBusy(true); setErr(null);
    try {
      await api('POST', '/api/admin/editors', {
        email,
        role,
        locations: role === 'super' ? [] : campuses,
      });
      setEmail(''); setRole('location'); setCampuses([]);
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

  const codeToName = Object.fromEntries((locations || []).map((l) => [l.code, l.name]));

  function campusLabel(e) {
    if (e.role === 'super') return null;
    const codes = e.locations || [];
    if (codes.length === 0) return 'no campus';
    return codes.map((c) => codeToName[c] || c).join(', ');
  }

  return (
    <div className="card">
      <h3>Editors</h3>
      <p className="hint">
        Only these Google accounts can sign in. <strong>Superadmins</strong> (like you, Tasha, Robbie) edit
        global text, manage locations &amp; templates, and add editors across every campus. <strong>Campus
        editors</strong> (DOPs) can only show/hide sections and override text for their assigned campus.
      </p>
      {editors.map((e) => (
        <div className="list-row" key={e.email}>
          <span className="grow">
            {e.email} {e.email === editorEmail && <span className="badge ok">you</span>}{' '}
            <span className={`badge ${e.role === 'super' ? 'ok' : 'edit'}`}>
              {e.role === 'super' ? 'Superadmin' : 'Campus editor'}
            </span>
            {campusLabel(e) && <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>{campusLabel(e)}</span>}
          </span>
          <span className="muted" style={{ fontSize: 12 }}>{e.added_by ? `added by ${e.added_by}` : ''}</span>
          {e.email !== editorEmail && <button className="btn ghost small" onClick={() => remove(e.email)}>Remove</button>}
        </div>
      ))}

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div className="field">
          <label>Add an editor by email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@alpha.school" />
        </div>
        <div className="field">
          <label>Role</label>
          <div className="row" style={{ gap: 16 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
              <input type="radio" name="role" style={{ width: 'auto' }} checked={role === 'location'} onChange={() => setRole('location')} />
              Campus editor (DOP)
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
              <input type="radio" name="role" style={{ width: 'auto' }} checked={role === 'super'} onChange={() => setRole('super')} />
              Superadmin
            </label>
          </div>
        </div>
        {role === 'location' && (
          <div className="field">
            <label>Assigned campuses <span className="ex">campus editors can only edit these</span></label>
            {(locations || []).length === 0 && <p className="muted" style={{ fontSize: 13 }}>No locations yet.</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {(locations || []).map((l) => (
                <label key={l.code} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
                  <input type="checkbox" style={{ width: 'auto' }} checked={campuses.includes(l.code)} onChange={() => toggleCampus(l.code)} />
                  {l.name}
                </label>
              ))}
            </div>
          </div>
        )}
        <button className="btn" disabled={busy} onClick={add} style={{ marginTop: 4 }}>Add editor</button>
      </div>
      {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
    </div>
  );
}

/* ─────────────────────────── Signed forms ─────────────────────────── */
function SignaturesTab() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let live = true;
    fetch('/api/admin/signatures')
      .then((r) => r.json())
      .then((d) => { if (live) { if (d.error) setErr(d.error); else setRows(d.signatures || []); } })
      .catch((e) => live && setErr(e.message));
    return () => { live = false; };
  }, []);

  function fmt(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="card">
      <h3>Signed forms</h3>
      <p className="hint">Forms families have signed and submitted through the handbook. Newest first.</p>
      {err && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{err}</p>}
      {!rows && !err && <p className="muted">Loading…</p>}
      {rows && rows.length === 0 && <p className="muted" style={{ fontSize: 14 }}>No signed forms yet.</p>}
      {rows && rows.map((r) => (
        <div className="list-row" key={r.id} style={{ alignItems: 'flex-start' }}>
          <span className="grow">
            <strong>{r.section_title || r.section_key}</strong>{' '}
            <span className="muted mono" style={{ fontSize: 12 }}>· {r.location_code}</span>
            <div style={{ fontSize: 13, marginTop: 2 }}>
              {r.parent_name}{r.student_name ? ` — student: ${r.student_name}` : ''}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              Signed: <span style={{ fontFamily: "'Snell Roundhand','Segoe Script',cursive", fontSize: 16, color: 'var(--navy)' }}>{r.signature}</span>
            </div>
          </span>
          <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmt(r.signed_at)}</span>
        </div>
      ))}
    </div>
  );
}
