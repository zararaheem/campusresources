import { getStore } from '@/lib/store';
import { EVENT_CATEGORIES, groupByMonth, formatRange } from '@/lib/calendar';
import AddToCalendar, { DownloadYearIcs } from '../components/AddToCalendar';
import PrintButton from '../components/PrintButton';

export const dynamic = 'force-dynamic';

function Missing({ code, message }) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="logo-word">Alpha<span className="dot">.</span></div>
        <h1 className="cr-title" style={{ fontSize: 30 }}>{message}</h1>
        <a className="btn gold" href={code ? `/?code=${code}` : '/'} style={{ marginTop: 12 }}>← Back to handbook</a>
      </div>
    </div>
  );
}

export default async function CalendarPage({ searchParams }) {
  const sp = await searchParams;
  const code = (sp?.code || '').trim();
  if (!code) return <Missing code="" message="Enter a campus code first" />;

  const store = getStore();
  const location = await store.getLocationByCode(code);
  if (!location) return <Missing code="" message="Code not found" />;

  const events = Array.isArray(location.calendar) ? location.calendar : [];
  if (events.length === 0) return <Missing code={location.code} message="No calendar set for this campus yet" />;

  const months = groupByMonth(events);
  const addr = location.fields?.address;
  const yearLabel = location.academic_year ? `${location.academic_year} Academic Calendar` : 'Academic Calendar';
  const calName = `Alpha ${location.name} ${location.academic_year || ''}`.trim();

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <span className="brandmark">Alpha <span className="accent">Campus Calendar</span></span>
          <span className="spacer" />
          <div className="tb-actions">
            <a className="tb-btn" href={`/?code=${location.code}`}>← Handbook</a>
            <DownloadYearIcs events={events} location={addr} calName={calName} className="tb-btn gold" />
            <PrintButton />
          </div>
        </div>
      </div>

      <header className="cover">
        <div className="cover-inner">
          <p className="eyebrow">Alpha {location.name}</p>
          <h1>{yearLabel}</h1>
          <p className="sub">Key dates for the school year. Add any event to your Google or Apple calendar.</p>
          <div className="meta">
            <span className="pill gold">{location.academic_year || 'Living Edition'}</span>
            <span className="pill mono">{location.code}</span>
          </div>
        </div>
      </header>

      <div className="shell" style={{ maxWidth: 820 }}>
        <div className="cal-legend">
          {Object.entries(EVENT_CATEGORIES).map(([key, c]) => (
            <span className="lg" key={key}>
              <span className="dot" style={{ background: c.color }} /> {c.label}
            </span>
          ))}
        </div>

        {months.map((m) => (
          <div className="cal-month" key={m.key}>
            <h3>{m.label}</h3>
            {m.events.map((ev, i) => {
              const cat = EVENT_CATEGORIES[ev.category] || EVENT_CATEGORIES.session;
              return (
                <div className="cal-row" key={`${ev.date}-${i}`}>
                  <span className="cal-tag" style={{ background: cat.color }} />
                  <span className="cal-date">{formatRange(ev)}</span>
                  <span className="cal-title">{ev.title}</span>
                  <span className="cal-cat" style={{ background: cat.soft, color: cat.color }}>{cat.label}</span>
                  <AddToCalendar event={ev} location={addr} calName={calName} />
                </div>
              );
            })}
          </div>
        ))}

        <p className="foot">
          Alpha {location.name} · {yearLabel} · Dates are subject to change; check ParentSquare for updates.
        </p>
      </div>
    </>
  );
}
