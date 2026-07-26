import { FIELD_DEFS } from './seed';

const PLACEHOLDER_RE = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

// Replace {{field}} tokens in a body with a location's field values.
// Missing/empty values are rendered as a visible marker so editors can see
// what still needs to be filled in to align a new campus.
export function interpolate(body, fields) {
  if (!body) return '';
  return body.replace(PLACEHOLDER_RE, (_m, key) => {
    const val = fields?.[key];
    if (val === undefined || val === null || String(val).trim() === '') {
      return `‹${key} — not set›`;
    }
    return String(val);
  });
}

// Which placeholder keys appear in the default sections but are not filled
// for this location. Used to show an "alignment checklist" in the admin.
export function missingFields(sections, fields) {
  const used = new Set();
  for (const s of sections) {
    let m;
    PLACEHOLDER_RE.lastIndex = 0;
    while ((m = PLACEHOLDER_RE.exec(s.body || '')) !== null) {
      used.add(m[1]);
    }
  }
  const missing = [];
  for (const key of used) {
    const val = fields?.[key];
    if (val === undefined || val === null || String(val).trim() === '') {
      const def = FIELD_DEFS.find((f) => f.key === key);
      missing.push({ key, label: def?.label || key });
    }
  }
  return missing;
}

// Merge default sections + a location's fields + overrides into the final
// handbook the viewer renders.
export function resolveHandbook(sections, location) {
  const fields = location?.fields || {};
  const overrides = location?.overrides || {};
  const ordered = [...sections].sort((a, b) => a.position - b.position);

  const resolved = ordered
    .map((s) => {
      const ov = overrides[s.key] || {};
      if (ov.hidden) return null;
      const title = ov.title || s.title;
      const rawBody = ov.body != null ? ov.body : s.body;
      return {
        key: s.key,
        group: s.group_name || s.group,
        title,
        body: interpolate(rawBody, fields),
        overridden: ov.body != null || ov.title != null,
      };
    })
    .filter(Boolean);

  // Group in the canonical group order they appear in.
  const groups = [];
  for (const sec of resolved) {
    let g = groups.find((x) => x.name === sec.group);
    if (!g) {
      g = { name: sec.group, sections: [] };
      groups.push(g);
    }
    g.sections.push(sec);
  }

  return { location, sections: resolved, groups };
}
