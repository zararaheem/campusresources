// Calendar helpers shared by the calendar page and add-to-calendar buttons.
// Pure functions (no DOM / no Node) so they run on server and client.

// Event categories authors use (staff days intentionally omitted).
export const EVENT_CATEGORIES = {
  session: { label: 'First / Last Day & Sessions', color: '#1b4dc1', soft: '#e7edfb' },
  holiday: { label: 'Holiday', color: '#8a7a5f', soft: '#e9e2d4' },
  break: { label: 'Break', color: '#6b4fb0', soft: '#eae2f8' },
  testing: { label: 'Testing', color: '#a9822a', soft: '#faf0cf' },
  'early-dismissal': { label: 'Early Dismissal', color: '#16233f', soft: '#e7eaf1' },
  'campus-event': { label: 'Campus Event', color: '#2f6bdd', soft: '#e6eefb' },
};

// The color KEY shown on the grid (day-cell styles).
export const DAY_LEGEND = [
  { key: 'start-end', label: 'Start / End' },
  { key: 'school', label: 'School Day' },
  { key: 'holiday', label: 'Holiday' },
  { key: 'break', label: 'Break' },
  { key: 'testing', label: 'Testing' },
  { key: 'early-dismissal', label: 'Early Dismissal' },
  { key: 'campus-event', label: 'Campus Event' },
];

// The legend rows that actually apply to a given calendar. Prevents showing a
// key (e.g. "Early Dismissal") for a day-type that never appears on the grid.
export function legendFor(sessions = [], events = []) {
  const cats = new Set((events || []).map((e) => e.category));
  const hasSessions = (sessions || []).length > 0;
  return DAY_LEGEND.filter((l) =>
    l.key === 'start-end' || l.key === 'school' ? hasSessions : cats.has(l.key)
  );
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parts(iso) {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  return { y, m, d };
}
function pad(n) { return String(n).padStart(2, '0'); }
function iso(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }

export function compactDate(isoStr, addDays = 0) {
  const { y, m, d } = parts(isoStr);
  const dt = new Date(Date.UTC(y, m - 1, d + addDays));
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`;
}

export function formatRange(ev) {
  const s = parts(ev.date);
  if (!ev.end) return `${MONTHS_SHORT[s.m - 1]} ${s.d}`;
  const e = parts(ev.end);
  if (s.m === e.m) return `${MONTHS_SHORT[s.m - 1]} ${s.d}–${e.d}`;
  return `${MONTHS_SHORT[s.m - 1]} ${s.d} – ${MONTHS_SHORT[e.m - 1]} ${e.d}`;
}
export function shortDate(isoStr) {
  const s = parts(isoStr);
  return `${MONTHS_SHORT[s.m - 1].toUpperCase()} ${s.d}`;
}
export function monthName(m1) { return MONTHS[m1 - 1]; }

export function groupByMonth(events) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const groups = [];
  for (const ev of sorted) {
    const { y, m } = parts(ev.date);
    const key = `${y}-${m}`;
    let g = groups.find((x) => x.key === key);
    if (!g) { g = { key, label: `${monthName(m)} ${y}`, events: [] }; groups.push(g); }
    g.events.push(ev);
  }
  return groups;
}

// ── Grid building ────────────────────────────────────────────────
// The list of {year, month} a session spans, inclusive.
export function sessionMonths(session) {
  const s = parts(session.start);
  const e = parts(session.end);
  const out = [];
  let y = s.y, m = s.m;
  while (y < e.y || (y === e.y && m <= e.m)) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

// A 6×7 matrix of {day, iso} (or null) for a month, weeks start on Sunday.
export function monthMatrix(year, month) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startDow = first.getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push({ day: d, iso: iso(year, month, d) });
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function covers(ev, isoStr) {
  const end = ev.end || ev.date;
  return isoStr >= ev.date && isoStr <= end;
}
function isWeekend(isoStr) {
  const { y, m, d } = parts(isoStr);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 || dow === 6;
}

// Classify one day for the grid: base fill + overlay markers.
export function classifyDay(isoStr, sessions, events) {
  const inSession = sessions.some((s) => isoStr >= s.start && isoStr <= s.end);
  const startEnd = sessions.some((s) => isoStr === s.start || isoStr === s.end);
  const weekend = isWeekend(isoStr);

  let base = 'out';
  const holiday = events.find((e) => e.category === 'holiday' && covers(e, isoStr));
  const brk = events.find((e) => e.category === 'break' && covers(e, isoStr));
  const testing = events.find((e) => e.category === 'testing' && covers(e, isoStr));
  if (holiday) base = 'holiday';
  else if (brk) base = 'break';
  else if (testing && !weekend) base = 'testing';
  else if (inSession && !weekend) base = 'school';

  const dismissal = events.some((e) => e.category === 'early-dismissal' && covers(e, isoStr));
  const dot = events.some((e) => e.category === 'campus-event' && e.date === isoStr && !e.end);

  return { base, startEnd, dismissal, dot, inSession };
}

// The KEY DATES list for a session (events whose start falls in its range).
export function keyDatesFor(session, events) {
  return events
    .filter((e) => e.date >= session.start && e.date <= session.end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Next upcoming event on/after todayIso.
export function nextEvent(events, todayIso) {
  return [...events].sort((a, b) => a.date.localeCompare(b.date)).find((e) => (e.end || e.date) >= todayIso) || null;
}

// ── Add-to-calendar links ────────────────────────────────────────
export function googleCalUrl(ev, { location } = {}) {
  const start = compactDate(ev.date);
  const end = compactDate(ev.end || ev.date, 1);
  const params = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${start}/${end}` });
  if (location) params.set('location', location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
export function buildIcs(events, { calName = 'Alpha Calendar', location } = {}) {
  const list = Array.isArray(events) ? events : [events];
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Alpha Campus Handbook//Calendar//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${icsEscape(calName)}`];
  for (const ev of list) {
    const start = compactDate(ev.date);
    const end = compactDate(ev.end || ev.date, 1);
    const uid = `${start}-${ev.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}@alpha-handbook`;
    lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${start}T000000Z`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`, `SUMMARY:${icsEscape(ev.title)}`);
    if (location) lines.push(`LOCATION:${icsEscape(location)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
