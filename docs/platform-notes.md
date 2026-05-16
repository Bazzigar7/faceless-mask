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

---

## Postgres operational gotchas

### `pg_get_functiondef()` errors on aggregate functions (Phase 3.3.1, 2026-05-17)
- Audit queries that loop `pg_proc` unfiltered (e.g., "find any function whose body references table X") trip a Postgres error on the first built-in aggregate they hit: `array_agg is an aggregate function`.
- Root cause: `pg_get_functiondef()` doesn't support aggregate functions; it errors instead of returning their definition. Postgres ships dozens of built-in aggregates (`array_agg`, `string_agg`, `jsonb_agg`, etc.), so any unfiltered loop hits one early.
- Fix: filter to plain functions via `WHERE p.prokind = 'f'`. Excludes `'a'` aggregates, `'w'` window functions, `'p'` procedures. Aggregates can't reference user tables in their definitions anyway, so the filter loses no audit signal.
- Reusable for any future schema-tightening audit that needs to enumerate functions referencing a table. Source case: Phase 3.3.1 dependency preflight Q7 (commit 0a06cd5).

---

## Verification methodology

### Byte-level dispute resolution for rendered file content (Phase 3.3.1, 2026-05-17)
- Rendered views of file content — write-tool dialogs, chat-rendered `cat -n` output, screenshots, terminal scrollback — can mismatch byte reality at any layer of transport (wrap, copy-trim, markdown parse, font rendering).
- When two parties in a review loop disagree about what bytes are on disk, do NOT act on either party's rendered view. Drop to hex inspection: `xxd <file>` or `sed -n 'Np' <file> | xxd` for a specific line.
- Hex gives literal byte values (including line terminators, control characters, multi-byte UTF-8 sequences). Ground truth; rendered views are not.
- Source case: Phase 3.3.1's verify gate (commit 0a06cd5). A chat-rendered `cat -n` inspection of line 9 appeared to show a missing semicolon at end of line. Hex showed `0x29 0x29 0x3b 0x0a` (`));\n`) — the semicolon was present. Acting on the rendered view would have introduced actual drift (line ending in `));;`).
- Discipline pattern: when one party in the review is confident, the other party's job is to require byte-level proof rather than accept the assertion. Both directions of drift suspicion need the same resolution path.

---

## Browser

### Safari microphone permission (Phase 3.3.1 smoke, 2026-05-17)
- Safari requires per-site explicit microphone permission grant. First voice-loop press on a fresh Safari install prompts for mic access; declining or ignoring leaves the voice loop silently non-functional with no in-app error surface.
- Chrome auto-grants for HTTPS sites in many flows; Safari does not.
- Not a regression from any Mask-side change. Worth flagging in any future public-share / classroom-deploy docs.
