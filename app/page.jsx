import { getStore } from '@/lib/store';
import { resolveHandbook } from '@/lib/resolve';
import { renderMarkdown } from '@/lib/markdown';
import AlphaLogo from './components/AlphaLogo';
import SearchBar from './components/SearchBar';
import AskAI from './components/AskAI';
import PrintButton from './components/PrintButton';
import SignForm from './components/SignForm';

export const dynamic = 'force-dynamic';

function toPlainText(md) {
  return (md || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_>`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function Landing({ code }) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <AlphaLogo size={46} />
        <p className="campus-tag">Campus Resources</p>
        <div className="access-card">
          <h2>Campus Handbook</h2>
          <p>Enter your access code to continue.</p>
          <form className="access-stack" method="get" action="/">
            <input type="text" name="code" placeholder="Access code" defaultValue={code || ''} autoFocus autoComplete="off" aria-label="Access code" />
            <button type="submit">View handbook</button>
          </form>
        </div>
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
  if (!location) {
    return (
      <div className="landing">
        <div className="landing-inner">
          <AlphaLogo size={46} />
          <p className="campus-tag">Campus Resources</p>
          <div className="access-card">
            <h2>Code not found</h2>
            <p>We couldn&apos;t find a handbook for “{code}”. Double-check the code, or ask your campus coordinator.</p>
            <form className="access-stack" method="get" action="/">
              <input type="text" name="code" placeholder="Access code" autoComplete="off" aria-label="Access code" />
              <button type="submit">Try again</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const sections = await store.listSections();
  const { groups, sections: resolved, edited } = resolveHandbook(sections, location);
  const editionLabel = location.edition ? `${location.edition} Edition` : 'Living Edition';
  const cityLabel = location.fields?.city || location.name;
  const hasCalendar = Array.isArray(location.calendar) && location.calendar.length > 0;
  const searchIndex = resolved.map((s) => ({ key: s.key, title: s.title, group: s.group, text: toPlainText(s.body) }));

  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <AlphaLogo size={38} />
          <p className="eyebrow">Alpha Campus Handbook · {cityLabel} · {editionLabel}</p>
          <h1>{location.name} Campus Handbook</h1>
          <p className="sub">Everything families need to know, all in one place.</p>
          <div className="pills">
            <span className="pill gold">{editionLabel}</span>
            {location.fields?.address && <span className="pill">{location.fields.address.split('\n')[0]}</span>}
            {edited?.label && <span className="pill">Last edited {edited.label}</span>}
          </div>
        </div>

        {/* Full-page cover — only rendered in the printed / PDF version. */}
        <div className="print-cover" aria-hidden="true">
          <div className="pc-center">
            <AlphaLogo size={72} />
            <div className="pc-title">Campus Handbook</div>
            <div className="pc-city">{cityLabel}</div>
            <div className="pc-edition">{editionLabel}</div>
          </div>
          {edited?.label && <div className="pc-edited">Last edited: {edited.label}</div>}
        </div>
      </header>

      <div className="wrap">
        <div className="toolbar">
          <SearchBar index={searchIndex} />
          <span className="spacer" />
          {hasCalendar && <a className="pill-btn solid" href={`/calendar?code=${location.code}`}>Calendar <span aria-hidden>↗</span></a>}
          <PrintButton className="pill-btn" label="Download as PDF" />
        </div>

        <div className="grid">
          <input type="checkbox" id="toc-toggle" className="toc-toggle-cb" aria-hidden="true" />
          <nav className="toc" aria-label="On this page">
            <label htmlFor="toc-toggle" className="toc-summary">On this page</label>
            <div className="toc-body">
              {groups.map((g) => (
                <div className="toc-group" key={g.name}>
                  <h5>{g.name}</h5>
                  {g.sections.map((s) => (
                    <a key={s.key} href={`#${s.key}`}>{s.title}</a>
                  ))}
                </div>
              ))}
            </div>
          </nav>

          <main>
            {groups.map((g) => (
              <div key={g.name}>
                <h2 className="section-group-title">{g.name}</h2>
                {g.sections.map((s) => (
                  <section key={s.key} id={s.key} className="section">
                    <h2>{s.title}</h2>
                    <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(s.body) }} />
                    {s.signable && <SignForm code={location.code} sectionKey={s.key} sectionTitle={s.title} bodyHtml={renderMarkdown(s.body)} />}
                  </section>
                ))}
              </div>
            ))}
            <p className="foot">
              {location.name} Campus Handbook · {editionLabel}
              {edited?.label ? ` · Last edited ${edited.label}` : ''} · This handbook is a living document.
            </p>
          </main>
        </div>
      </div>

      <AskAI index={searchIndex} team={location.name} />
    </>
  );
}
