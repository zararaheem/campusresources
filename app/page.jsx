import { getStore } from '@/lib/store';
import { resolveHandbook } from '@/lib/resolve';
import { renderMarkdown } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

function Landing() {
  return (
    <div className="shell">
      <div className="center-card">
        <h1>Alpha Campus Handbook</h1>
        <p>Enter your campus code to open your handbook (for example, <code>nyc-2026</code>).</p>
        <form className="code-form" method="get" action="/">
          <div style={{ flex: 1, minWidth: 200 }}>
            <input type="text" name="code" placeholder="campus code" autoFocus autoComplete="off" />
          </div>
          <button className="btn" type="submit">Open handbook</button>
        </form>
        <p className="foot" style={{ marginTop: 26 }}>
          Campus staff — <a href="/admin">edit the handbook →</a>
        </p>
      </div>
    </div>
  );
}

function NotFound({ code }) {
  return (
    <div className="shell">
      <div className="center-card">
        <h1>Code not found</h1>
        <p>
          We couldn&apos;t find a handbook for <code>{code}</code>. Double-check the code, or ask your
          campus coordinator.
        </p>
        <a className="btn ghost" href="/">Try another code</a>
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
  const { groups } = resolveHandbook(sections, location);
  const editionLabel = location.edition ? `${location.edition} Edition` : 'Living Edition';

  return (
    <>
      <header className="cover">
        <div className="cover-inner">
          <p className="eyebrow">Alpha Campus Handbook</p>
          <h1>{location.name} Campus Handbook</h1>
          <p className="sub">Everything families need to know, all in one place.</p>
          <div className="meta">
            <span className="pill">{editionLabel}</span>
            <span className="pill mono">{location.code}</span>
            {location.fields?.address && <span className="pill">{location.fields.address.split('\n')[0]}</span>}
          </div>
        </div>
      </header>

      <div className="shell">
        <div className="grid">
          <nav className="nav" aria-label="Handbook sections">
            {groups.map((g) => (
              <div key={g.name}>
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
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(s.body) }}
                  />
                </section>
              ))
            )}
            <p className="foot">
              {location.name} Campus Handbook · {editionLabel} · This handbook is a living document and
              may be updated during the year.
            </p>
          </main>
        </div>
      </div>
    </>
  );
}
