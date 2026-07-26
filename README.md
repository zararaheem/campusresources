# Alpha Campus Handbook

One **aligned** handbook for every Alpha campus, with a **live edition per location** opened by a
code — e.g. `https://your-app.vercel.app/?code=nyc-2026`. Approved staff edit any section from a
Google-gated backend, and changes go live immediately.

## How it works

- **One default handbook.** Every campus shares the same handbook content (the "Default Handbook"
  tab in the editor). Edit it once, and it updates everywhere.
- **Per-location fields.** Anything that differs by campus — address, contacts, drop-off times,
  state law, evacuation assembly areas — is a `{{placeholder}}` in the default text, filled in per
  location under **Campus details**. This is what keeps every campus *aligned*: the words are shared,
  only the specifics change.
- **Per-section overrides.** For the rare case where a whole section needs different wording at one
  campus, you can override (or hide) just that section for just that location.
- **Codes.** Each campus edition has a code (`nyc-2026`, `austin-2026`, …). Families open their
  handbook at `/?code=<code>`. Unpublished codes return "not found".

Opening a code renders: the default sections → with that location's fields filled in → with any of
its overrides applied.

## Features

- **Navy/cream handbook** with a sticky top bar: **Search**, **Calendar**, and **Download PDF** (uses
  the browser's print → Save as PDF).
- **Search** — instant client-side search that jumps to the matching section.
- **Find an answer** — a floating keyword helper (no external API) that matches a family's question to
  the most relevant sections and links to them; if nothing matches, it points families to their campus
  team via ParentSquare.
- **Campus calendar** — a per-location academic calendar at `/calendar?code=<code>`. Each event has
  **Add to Google** and **Apple/.ics** buttons, plus a **Download full calendar (.ics)** for the year.
- **Google Maps links** — campus address and evacuation assembly areas link out to Google Maps.
- **External resource links** — known references (e.g. NWEA MAP, ParentSquare) auto-link out; editors
  can also add Markdown links anytime.
- **Last edited** month shown on the cover, from the most recent section/location edit.

## Access

- **Reading** the handbook is open to anyone with the code (no login).
- **Editing** is gated by **Google sign-in + an allowlist**. Only emails on the `editors` list can
  open `/admin`, edit sections, fill in campus details, add locations, or manage other editors. Seed
  the first editor(s) with `SEED_EDITOR_EMAILS`; after that, editors add each other from the
  **Editors** tab.

## Tech

- **Next.js** (App Router) — deploys to Vercel.
- **Supabase (Postgres)** — the live, shared data store (`sections`, `locations`, `editors`).
- **Auth.js (NextAuth)** with the Google provider for the editor allowlist.
- A local JSON file store (`data/store.json`) is used automatically when Supabase env vars are
  absent, so you can run and click around locally with zero cloud setup. **It is not used in
  production** (Vercel's filesystem is ephemeral).

## Local development

```bash
npm install
cp .env.example .env.local
# For a quick local look without Google/Supabase, set:  AUTH_DEV_BYPASS=true
npm run dev
```

- Handbook: <http://localhost:3000/?code=nyc-2026>
- Editor: <http://localhost:3000/admin>  (with `AUTH_DEV_BYPASS=true`, you're signed in as the first
  `SEED_EDITOR_EMAILS` address)

Local edits persist to `data/store.json` (git-ignored). Delete that file to reset to the seed.

## Deploying (Vercel + Supabase)

1. **Supabase**
   - Create a project. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql).
   - From **Project Settings → API**, copy the **Project URL** and the **service_role** key.

2. **Google OAuth**
   - Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID → Web
     application**.
   - Authorized redirect URIs:
     - `https://YOUR-DOMAIN/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for local testing)
   - Copy the **Client ID** and **Client secret**.

3. **Vercel** — import this repo and set the environment variables below, then deploy. On first load
   the app seeds the default handbook, the `nyc-2026` edition, and the seed editors into Supabase.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Auth.js session secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `SEED_EDITOR_EMAILS` | Comma-separated emails allowed in on first run |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only) |
| `AUTH_DEV_BYPASS` | `true` only for local dev; never in production |

The Supabase schema gained two columns for the calendar (`locations.academic_year`,
`locations.calendar`). If you set up Supabase before this feature, re-run
[`supabase/schema.sql`](supabase/schema.sql) — the `create table` is `if not exists`, so add the
columns with:

```sql
alter table locations add column if not exists academic_year text not null default '';
alter table locations add column if not exists calendar jsonb not null default '[]'::jsonb;
```

## Adding a new campus

1. Sign in to `/admin` → **Locations** → **+ New location**.
2. Give it a code (e.g. `austin-2026`), a name, and an edition label. Optionally copy field values
   from an existing campus to start.
3. Fill in **Campus details** — the editor flags exactly which fields the handbook still needs.
4. Share `/?code=austin-2026`.

## Project layout

```
app/
  page.jsx                     # public viewer (?code=)
  admin/                       # Google-gated editor (sign-in, shell, UI)
  api/
    auth/[...nextauth]/        # Auth.js routes
    admin/                     # editor API (sections, locations, overrides, editors)
lib/
  seed.js                      # default handbook + fields + NYC values
  resolve.js                   # merge default + fields + overrides
  store/                       # supabase driver + local fallback
supabase/schema.sql            # database schema
```
