import { getStore } from '@/lib/store';
import { resolveHandbook } from '@/lib/resolve';
import { renderMarkdown } from '@/lib/markdown';
import SearchBar from './components/SearchBar';
import AskAI from './components/AskAI';
import PrintButton from './components/PrintButton';

export const dynamic = 'force-dynamic';

function toPlainText(md) {
  return (md || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_>`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function Landing() {
  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="logo-word">Alpha<span className="dot">.</span></div>
        <h1 className="cr-title">Campus Resources</h1>
        <p className="cr-sub">Please enter your campus code to view.</p>
        <form className="code-stack" method="get" action="/">
          <input type="text" name="code" placeholder="campus code" autoFocus autoComplete="off" aria-label="Campus code" />
          <button type="submit">Enter</button>
        </form>
      </div>
    </div>
  );
}

function NotFound({ code }) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="logo-word">Alpha<span className="dot">.</span></div>
        <h1 className="cr-title" style={{ fontSize: 30 }}>Code not found</h1>
        <p className="cr-sub">
          We couldn&apos;t find a handbook for <strong>{code}</strong>. Double-check the code, or ask your
          campus coordinator.
        </p>
        <form className="code-stack" method="get" action="/">
          <input type="text" name="code" placeholder="campus code" autoComplete="off" aria-label="Campus code" />
          <button type="submit">Try again</button>
        </form>
      </div>
    </div>
  );
}

export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const code = (sp?.code || '').trim();
  if (!code) return <Landing />;

  const store = getStore();
  const location = await store.getLocationByCode(code);
  if (!location) return <NotFound code={code} />;

  const sections = await store.listSections();
  const { groups, sections: resolved, edited } = resolveHandbook(sections, location);
  const editionLabel = location.edition ? `${location.edition} Edition` : 'Living Edition';
  const hasCalendar = Array.isArray(location.calendar) && location.calendar.length > 0;

  const searchIndex = resolved.map((s) => ({ key: s.key, title: s.title, group: s.group, text: toPlainText(s.body) }));

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <span className="brandmark">Alpha <span className="accent">Campus Resources</span></span>
          <span className="spacer" />
          <div className="tb-actions">
            <SearchBar index={searchIndex} />
            {hasCalendar && (
              <a className="tb-btn gold" href={`/calendar?code=${location.code}`}>📅 Calendar</a>
            )}
            <PrintButton />
          </div>
        </div>
      </div>

      <header className="cover">
        <div className="cover-inner">
          <p className="eyebrow">Alpha Campus Handbook</p>
          <h1>{location.name} Campus Handbook</h1>
          <p className="sub">Everything families need to know, all in one place.</p>
          <div className="meta">
            <span className="pill gold">{editionLabel}</span>
            <span className="pill mono">{location.code}</span>
            {location.fields?.address && <span className="pill">{location.fields.address.split('\n')[0]}</span>}
            {edited?.label && <span className="edited-note">Last edited {edited.label}</span>}
          </div>
        </div>
      </header>

      <div className="shell">
        <div className="grid">
          <nav className="nav" aria-label="Handbook sections">
            {groups.map((g) => (
              <div className="nav-group" key={g.name}>
                <h4>{g.name}</h4>
                {g.sections.map((s) => (
                  <a key={s.key} href={`#${s.key}`}>{s.title}</a>
                ))}
              </div>
            ))}
          </nav>

          <main>
            {groups.map((g) =>
              g.sections.map((s) => (
                <section key={s.key} id={s.key} className="section">
                  <span className="group-label">{g.name}</span>
                  <h2>{s.title}</h2>
                  <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.body) }} />
                </section>
              ))
            )}
            <p className="foot">
              {location.name} Campus Handbook · {editionLabel}
              {edited?.label ? ` · Last edited ${edited.label}` : ''} · This handbook is a living document.
            </p>
          </main>
        </div>
      </div>

      <AskAI code={location.code} />
    </>
  );
}
