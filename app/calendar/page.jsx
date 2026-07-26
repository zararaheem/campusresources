import { getStore } from '@/lib/store';
import { EVENT_CATEGORIES, groupByMonth, formatRange } from '@/lib/calendar';
import AddToCalendar, { DownloadYearIcs } from '../components/AddToCalendar';
import PrintButton from '../components/PrintButton';
import AlphaLogo from '../components/AlphaLogo';

export const dynamic = 'force-dynamic';

function Missing({ code, message }) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <AlphaLogo size={26} />
        <p className="campus-tag">Campus Resources</p>
        <div className="access-card">
          <h2>{message}</h2>
          <a className="btn gold" href={code ? `/?code=${code}` : '/'} style={{ marginTop: 8 }}>← Back to handbook</a>
        </div>
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
  const cityLabel = location.fields?.city || location.name;
  const yearLabel = location.academic_year ? `${location.academic_year} Academic Calendar` : 'Academic Calendar';
  const calName = `Alpha ${location.name} ${location.academic_year || ''}`.trim();

  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <AlphaLogo size={24} />
          <p className="eyebrow">Alpha {cityLabel} · Academic Calendar</p>
          <h1>{yearLabel}</h1>
          <p className="sub">Key dates for the school year. Add any event to your Google or Apple calendar.</p>
          <div className="pills">
            <span className="pill gold">{location.academic_year || 'Living Edition'}</span>
            <span className="pill">{location.code}</span>
          </div>
        </div>
      </header>

      <div className="wrap" style={{ maxWidth: 820 }}>
        <div className="toolbar">
          <a className="pill-btn" href={`/?code=${location.code}`}>← Handbook</a>
          <span className="spacer" />
          <DownloadYearIcs events={events} location={addr} calName={calName} className="pill-btn solid" />
          <PrintButton className="pill-btn" label="Download as PDF ↓" />
        </div>

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

        <p className="foot">Alpha {location.name} · {yearLabel} · Dates are subject to change; check ParentSquare for updates.</p>
      </div>
    </>
  );
}
