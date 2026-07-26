import { FIELD_DEFS, RESOURCE_LINKS } from './seed';

const PLACEHOLDER_RE = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

// Replace {{field}} tokens in a body with a location's field values.
// Missing/empty values are rendered as a visible marker so editors can see
// what still needs to be filled in to align a new campus.
export function interpolate(body, fields) {
  if (!body) return '';
  return body.replace(PLACEHOLDER_RE, (_m, key) => {
    const val = fields?.[key];
    if (val === undefined || val === null || String(val).trim() === '') {
      // Friendly prompt for the campus team on the viewer; the admin alignment
      // checklist lists exactly which fields (by label) still need filling in.
      return '*(campus team to add)*';
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

function mapsUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

// Insert one Markdown link for the first plain-text occurrence of `needle`.
// Skips occurrences already inside a Markdown link (…](… or […](…).
function linkOnce(md, needle, url) {
  if (!needle || needle.trim() === '') return md;
  const idx = md.indexOf(needle);
  if (idx === -1) return md;
  // crude guard: don't relink if it's already part of a link
  const before = md.slice(Math.max(0, idx - 1), idx);
  const after = md.slice(idx + needle.length, idx + needle.length + 2);
  if (before === '[' || after.startsWith('](')) return md;
  return `${md.slice(0, idx)}[${needle}](${url})${md.slice(idx + needle.length)}`;
}

// Add Google Maps links for campus places and external links for known
// resources (NWEA MAP, ParentSquare, …). Operates on Markdown before render.
export function linkify(md, { places = [], resources = RESOURCE_LINKS } = {}) {
  let out = md;
  for (const p of places) {
    if (p && String(p).trim()) out = linkOnce(out, p, mapsUrl(p));
  }
  for (const r of resources) {
    out = linkOnce(out, r.match, r.url);
  }
  return out;
}

function monthLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// The most recent edit across the shared sections and this location.
export function lastEdited(sections, location) {
  let latest = '';
  for (const s of sections) {
    if (s.updated_at && s.updated_at > latest) latest = s.updated_at;
  }
  if (location?.updated_at && location.updated_at > latest) latest = location.updated_at;
  return { iso: latest || null, label: monthLabel(latest) };
}

// Merge default sections + a location's fields + overrides into the final
// handbook the viewer renders.
export function resolveHandbook(sections, location) {
  const fields = location?.fields || {};
  const overrides = location?.overrides || {};
  const ordered = [...sections].sort((a, b) => a.position - b.position);

  // Campus places we can turn into Google Maps links.
  const places = [fields.address, fields.primary_assembly, fields.secondary_assembly].filter(Boolean);

  const resolved = ordered
    .map((s) => {
      const ov = overrides[s.key] || {};
      if (ov.hidden) return null;
      const title = ov.title || s.title;
      const rawBody = ov.body != null ? ov.body : s.body;
      const interpolated = interpolate(rawBody, fields);
      return {
        key: s.key,
        group: s.group_name || s.group,
        title,
        body: linkify(interpolated, { places }),
        overridden: ov.body != null || ov.title != null,
      };
    })
    .filter(Boolean);

  // Per-location sections a campus added for itself (e.g. state-specific
  // policies). They render at the end of whichever group they name.
  const extras = Array.isArray(location?.extra_sections) ? location.extra_sections : [];
  for (const ex of extras) {
    if (!ex || ex.hidden || !ex.title) continue;
    resolved.push({
      key: ex.key,
      group: ex.group || 'Policies',
      title: ex.title,
      body: linkify(interpolate(ex.body || '', fields), { places }),
      overridden: false,
      extra: true,
    });
  }

  const groups = [];
  for (const sec of resolved) {
    let g = groups.find((x) => x.name === sec.group);
    if (!g) {
      g = { name: sec.group, sections: [] };
      groups.push(g);
    }
    g.sections.push(sec);
  }

  return { location, sections: resolved, groups, edited: lastEdited(sections, location) };
}
