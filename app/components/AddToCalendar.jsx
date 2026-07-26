'use client';

import { buildIcs, googleCalUrl } from '@/lib/calendar';

// Per-event "Google" link + "Apple/.ics" download. `location` is the campus
// address used as the event location.
export default function AddToCalendar({ event, location, calName }) {
  function downloadIcs() {
    const ics = buildIcs(event, { calName: calName || event.title, location });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="cal-add no-print">
      <a href={googleCalUrl(event, { location })} target="_blank" rel="noreferrer" title="Add to Google Calendar">
        <span aria-hidden>◆</span> Google
      </a>
      <button onClick={downloadIcs} title="Add to Apple Calendar / download .ics">
        <span aria-hidden>⭳</span> Apple
      </button>
    </div>
  );
}

// Download the whole academic year as one .ics file.
export function DownloadYearIcs({ events, location, calName, className = 'tb-btn gold' }) {
  function download() {
    const ics = buildIcs(events, { calName, location });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(calName || 'academic-calendar').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  return (
    <button className={className} onClick={download}>
      <span aria-hidden>⭳</span> Download full calendar (.ics)
    </button>
  );
}
