// Calendar helpers shared by the calendar page and add-to-calendar buttons.
// Pure functions (no DOM / no Node) so they run on server and client.

export const EVENT_CATEGORIES = {
  session: { label: 'Session', color: '#1b4dc1', soft: '#e7edfb' },
  holiday: { label: 'Holiday / Break', color: '#b4690e', soft: '#fbefdc' },
  testing: { label: 'Testing', color: '#0f7b6c', soft: '#dcf3ee' },
  dismissal: { label: 'Early Dismissal', color: '#8a5cf6', soft: '#ece3fe' },
  staff: { label: 'Staff Meeting', color: '#64748b', soft: '#eef1f5' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Parse 'YYYY-MM-DD' into a plain {y,m,d} without timezone surprises.
function parts(iso) {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  return { y, m, d };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// Return YYYYMMDD, optionally shifted by `addDays` (handles month/year roll-over).
export function compactDate(iso, addDays = 0) {
  const { y, m, d } = parts(iso);
  const dt = new Date(Date.UTC(y, m - 1, d + addDays));
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`;
}

// Human label, e.g. "Sep 8" or "Sep 15–18" or "Dec 21 – Jan 1".
export function formatRange(ev) {
  const s = parts(ev.date);
  if (!ev.end) return `${MONTHS_SHORT[s.m - 1]} ${s.d}`;
  const e = parts(ev.end);
  if (s.m === e.m) return `${MONTHS_SHORT[s.m - 1]} ${s.d}–${e.d}`;
  return `${MONTHS_SHORT[s.m - 1]} ${s.d} – ${MONTHS_SHORT[e.m - 1]} ${e.d}`;
}

export function monthName(monthIndex1) {
  return MONTHS[monthIndex1 - 1];
}

// Group events by calendar month (in date order) for display.
export function groupByMonth(events) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const groups = [];
  for (const ev of sorted) {
    const { y, m } = parts(ev.date);
    const key = `${y}-${m}`;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: `${monthName(m)} ${y}`, events: [] };
      groups.push(g);
    }
    g.events.push(ev);
  }
  return groups;
}

// A Google Calendar "add event" link. All-day; end date is exclusive so we +1.
export function googleCalUrl(ev, { location } = {}) {
  const start = compactDate(ev.date);
  const end = compactDate(ev.end || ev.date, 1);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${start}/${end}`,
  });
  if (location) params.set('location', location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// Build an .ics document for one or many events (Apple Calendar, Outlook, etc.).
export function buildIcs(events, { calName = 'Alpha Calendar', location } = {}) {
  const list = Array.isArray(events) ? events : [events];
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alpha Campus Handbook//Calendar//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsEscape(calName)}`,
  ];
  for (const ev of list) {
    const start = compactDate(ev.date);
    const end = compactDate(ev.end || ev.date, 1);
    const uid = `${start}-${ev.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}@alpha-handbook`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${start}T000000Z`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${icsEscape(ev.title)}`
    );
    if (location) lines.push(`LOCATION:${icsEscape(location)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
