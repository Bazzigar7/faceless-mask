# Platform Notes

> Operational gotchas, CLI quirks, and platform-specific behaviors discovered during the Mask build. Reference before assuming a tool works the way its docs claim. Update at the end of each substep when something surprises us.

---

## Supabase CLI

**Pinned version when these notes were captured:** v2.98.2 (run `supabase --version` to check yours; if newer, behaviors below may have changed).

### `supabase init` (Phase 2b.1.2, 2026-05-09)
- Does NOT auto-create `supabase/seed.sql` anymore. Older docs and prompts assume it does. Don't fabricate one — schema lives in `migrations/`.
- Generates `supabase/.gitignore` with broader dotenv-aware patterns than older versions. Inspect it; don't assume it matches older READMEs.

### `supabase login` (Phase 2b.1.3, 2026-05-09)
- Required before `supabase link`. Uses browser-confirmed personal access token (account-level auth), separate from any project's keys.
- Caches token at `~/.supabase/`. One-time per machine.

### `supabase link --project-ref <ref>` (Phase 2b.1.3, 2026-05-09)
- Does NOT prompt for the database password on v2.98. Only needs account auth from `supabase login`.
- Writes link state to `supabase/.temp/` (gitignored), NOT to `supabase/config.toml`. Specifically `supabase/.temp/project-ref` holds the linked ref.
- `config.toml`'s `project_id` field is the LOCAL sanitized project name from init time, NOT the remote ref. Don't conflate them.
- Verification: `cat supabase/.temp/project-ref` should return your project ref.

### `supabase db push` (Phase 2b.1.5, 2026-05-09)
- Does NOT prompt for the database password either, on v2.98 + a logged-in shell. Connection initialized via cached auth.
- Does NOT show the SQL preview before applying — confirms by migration filename only. Review the migration file BEFORE pushing.
- `[Y/n]` confirmation accepts lowercase `y`.

### `supabase db dump --schema public` (Phase 2b.1.5, 2026-05-09)
- Unreliable on v2.98 — has a Docker dependency that silently fails when Docker isn't running, returning empty output instead of an error.
- For schema verification, prefer the dashboard Table Editor over `db dump | grep`. Dashboard is the source of truth.

### `supabase gen types typescript --linked` (Phase 2b.1.6, 2026-05-09)
- Connects to the live DB to introspect schema. Takes ~3-5 seconds. Output is the full TypeScript Database type declaration.
- Pipe directly to `lib/database.types.ts`. Don't hand-edit the result; regenerate from live whenever schema changes.

---

## Environment variables (Next.js + Supabase)

### `NEXT_PUBLIC_SUPABASE_URL` (Phase 2b.1.6, 2026-05-09)
- **Must be the bare project URL** with no trailing path. `https://<ref>.supabase.co` — NOT `https://<ref>.supabase.co/rest/v1/`.
- The Supabase dashboard's "Connect" / "REST API" / "Project URL" displays sometimes show the URL with `/rest/v1/` already appended depending on which page you copy from. Strip it on paste.
- `supabase-js` client appends the API path itself. Including `/rest/v1/` in the env var produces doubled paths (`/rest/v1//rest/v1/<table>`) and silent 404s on every query.

### Editor backups for `.env.local` (Phase 2b.1.6.b, 2026-05-09)
- nano leaves `.env.local.save` after edits. vim leaves `.env.local~` and `.env.local.swp`. Other editors have their own conventions.
- These backups contain ALL your secrets and aren't covered by a plain `.env.local` gitignore line.
- The repo's `.gitignore` now blocks `.env*.save`, `.env*~`, `.env*.swp`, `.env*.bak`. Add new patterns if you use a different editor.
- If you ever see one of these files in `git status`, delete it via `rm` immediately, then verify it's gone via `ls -la`.

---

## dotenv (Node loader)

### Marketing tip injection (Phase 2b.1.7, 2026-05-09)
- Recent `dotenv` versions inject a one-line marketing tip on every `config()` call. The prefix `◇ injected env (N) from .env.local // tip:` is stable; the tip portion that follows varies between loads — both the leading glyph and the text change.
- Examples observed during the Mask build (not exhaustive — future loads will produce more): `⤷ auth for agents [www.vestauth.com]`, `◈ encrypted .env [www.dotenvx.com]`, `⌘ custom filepath { path: '/custom/path/.env' }`.
- Cosmetic only. Doesn't affect env loading. Treat as routine output, not actionable.
- Silenceable via `dotenv.config({ path: '.env.local', debug: false })` if it ever becomes load-bearing noise (CI log clutter, broken grep targets, etc.).
