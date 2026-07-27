'use client';

import { useMemo, useState } from 'react';
import {
  EVENT_CATEGORIES,
  legendFor,
  groupByMonth,
  sessionMonths,
  monthMatrix,
  classifyDay,
  keyDatesFor,
  nextEvent,
  formatRange,
  monthName,
} from '@/lib/calendar';
import AddToCalendar from './AddToCalendar';
import AlphaLogo from './AlphaLogo';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Every month from the first to the last dated thing in the school year.
function schoolYearMonths(sessions, events) {
  const ds = [];
  (sessions || []).forEach((s) => { ds.push(s.start, s.end); });
  (events || []).forEach((e) => { ds.push(e.date, e.end || e.date); });
  if (!ds.length) return [];
  let min = ds[0], max = ds[0];
  for (const d of ds) { if (d < min) min = d; if (d > max) max = d; }
  let [y, m] = min.split('-').map(Number);
  const [ey, em] = max.split('-').map(Number);
  const out = [];
  while (y < ey || (y === ey && m <= em)) { out.push({ year: y, month: m }); m += 1; if (m > 12) { m = 1; y += 1; } }
  return out;
}
function monthKeyDates(year, month, events) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return (events || []).filter((e) => (e.date || '').startsWith(prefix)).sort((a, b) => a.date.localeCompare(b.date));
}

// Print-only "year at a glance": bright header + 12-month grid with key dates.
function PrintCalendar({ sessions, events, today, cityLabel, academicYear }) {
  const months = schoolYearMonths(sessions, events);
  const legend = legendFor(sessions, events);
  return (
    <div className="cal-print" aria-hidden="true">
      <div className="cpx-head">
        <div className="cpx-head-l">
          <div className="cpx-city">{cityLabel}</div>
          {academicYear && <div className="cpx-year">{academicYear}</div>}
          <div className="cpx-sub">Academic Calendar Year</div>
        </div>
        <AlphaLogo size={30} />
      </div>
      <div className="cal-print-grid">
        {months.map((m) => {
          const kd = monthKeyDates(m.year, m.month, events);
          return (
            <div className="cpm" key={`${m.year}-${m.month}`}>
              <MonthGrid year={m.year} month={m.month} sessions={sessions} events={events} today={today} />
              {kd.length > 0 && (
                <div className="cpm-dates">
                  {kd.map((ev, i) => (
                    <div className="cpm-date" key={i}>
                      <span className="cpm-d">{formatRange(ev)}</span>
                      <span className="cpm-t">{ev.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div className="cpm cpm-key">
          <div className="cpm-key-title">Key</div>
          {legend.map((l) => (
            <div className="cpm-key-item" key={l.key}>
              <span className={`swatch is-${l.key}`} />{l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function todayIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// One month grid. `today` highlights the current day.
function MonthGrid({ year, month, sessions, events, today }) {
  const weeks = monthMatrix(year, month);
  return (
    <div className="mgrid">
      <div className="mgrid-title">{monthName(month)} {year}</div>
      <div className="mgrid-dow">
        {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
      </div>
      <div className="mgrid-days">
        {weeks.flat().map((cell, i) => {
          if (!cell) return <span key={i} className="mday empty" />;
          const c = classifyDay(cell.iso, sessions, events);
          const cls = ['mday', `is-${c.base}`];
          if (c.startEnd) cls.push('is-startend');
          if (c.dismissal) cls.push('is-dismissal');
          if (c.dot) cls.push('has-event');
          if (cell.iso === today) cls.push('is-today');
          return (
            <span key={i} className={cls.join(' ')}>
              {cell.day}
              {c.dot && <span className="mday-dot" />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// KEY DATES rows for a session, each with add-to-calendar.
function KeyDates({ dates, addr, calName }) {
  if (dates.length === 0) return null;
  return (
    <div className="keydates">
      <div className="keydates-h">Key dates</div>
      {dates.map((ev, i) => {
        const cat = EVENT_CATEGORIES[ev.category] || EVENT_CATEGORIES.session;
        return (
          <div className="keydate" key={`${ev.date}-${i}`}>
            <span className="keydate-date">{formatRange(ev)}</span>
            <span className="keydate-title">
              <span className="kd-dot" style={{ background: cat.color }} />
              {ev.title}
            </span>
            <AddToCalendar event={ev} location={addr} calName={calName} />
          </div>
        );
      })}
    </div>
  );
}

export default function CalendarView({ sessions = [], events = [], addr, calName, cityLabel, academicYear }) {
  const [view, setView] = useState('session');
  const today = useMemo(() => todayIso(), []);
  const upcoming = useMemo(() => nextEvent(events, today), [events, today]);
  const byMonth = useMemo(() => groupByMonth(events), [events]);
  const legend = useMemo(() => legendFor(sessions, events), [sessions, events]);

  return (
    <div className="calview">
      {/* Print-only clean one-pager (12-month grid). */}
      <PrintCalendar sessions={sessions} events={events} today={today} cityLabel={cityLabel} academicYear={academicYear} />

      {/* Coming up */}
      {upcoming && (
        <div className="comingup">
          <span className="comingup-label">Coming up</span>
          <span className="comingup-date">{formatRange(upcoming)}</span>
          <span className="comingup-title">{upcoming.title}</span>
          <AddToCalendar event={upcoming} location={addr} calName={calName} />
        </div>
      )}

      {/* Color KEY */}
      <div className="cal-key">
        <span className="cal-key-label">Key</span>
        {legend.map((l) => (
          <span className="cal-key-item" key={l.key}>
            <span className={`swatch is-${l.key}`} />{l.label}
          </span>
        ))}
      </div>

      {/* View toggle */}
      <div className="cal-toggle">
        <button className={view === 'session' ? 'on' : ''} onClick={() => setView('session')}>By session</button>
        <button className={view === 'month' ? 'on' : ''} onClick={() => setView('month')}>By month</button>
      </div>

      {view === 'session' ? (
        sessions.map((s) => {
          const months = sessionMonths(s);
          const kd = keyDatesFor(s, events);
          return (
            <section className="cal-session" key={s.name}>
              <header className="cal-session-h">
                <h3>{s.name}</h3>
                <span className="cal-session-range">{formatRange({ date: s.start, end: s.end })}</span>
              </header>
              <div className="mgrid-row">
                {months.map((m) => (
                  <MonthGrid key={`${m.year}-${m.month}`} year={m.year} month={m.month} sessions={sessions} events={events} today={today} />
                ))}
              </div>
              <KeyDates dates={kd} addr={addr} calName={calName} />
            </section>
          );
        })
      ) : (
        <div className="cal-months">
          <div className="mgrid-row">
            {byMonth.map((g) => {
              const [y, m] = g.key.split('-').map((n) => parseInt(n, 10));
              return <MonthGrid key={g.key} year={y} month={m} sessions={sessions} events={events} today={today} />;
            })}
          </div>
          {byMonth.map((g) => (
            <KeyDates key={`kd-${g.key}`} dates={g.events} addr={addr} calName={calName} />
          ))}
        </div>
      )}
    </div>
  );
}
