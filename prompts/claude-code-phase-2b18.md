# Phase 2b.1.8 — End-of-substep README + platform notes sweep

This is the closing micro-step of Phase 2b.1. Schema is deployed, types are generated, smoke test passed. Everything works. Now we capture the operational learnings so future sessions don't re-hit the same gotchas, and we mark the substep done in the README's roadmap.

## Plan first — no edits yet

Walk me through your planned edits as a structured summary BEFORE writing anything. I want to approve the plan, then approve each individual edit. Per discipline: pause-and-approve every str_replace and every file creation.

## Scope — six edits across two files, one commit

This whole sweep ships as a **single commit** with message:
```
Phase 2b.1.8: End-of-substep README + platform notes sweep
```

The files touched: `README.md` (modified) and `docs/platform-notes.md` (new file).

---

### Edit 1 — README: tick the 2b.1 substep box

In the "Phase 2b — Admin + memory + database" sub-bucket of the Build phases section, the substep list currently reads:

```
- [ ] 2b.1: Schema deployed, types generated *(this substep)*
```

Change to:
```
- [x] 2b.1: Schema deployed, types generated ✅ shipped 2026-05-09
```

Remove the *(this substep)* annotation since 2b.1 is no longer the current substep. The next session will pick the new current substep.

### Edit 2 — README: seed.sql note in supabase/ folder structure block

The folder structure section's `supabase/` block currently lists `config.toml` and `migrations/` as children. Add a one-line note after that block (NOT as a tree child, but as a note paragraph below):

> Note: `supabase/seed.sql` is not present. Supabase CLI v2.98+ no longer auto-creates it on `supabase init`. Schema lives in `migrations/`; we don't need a seed file.

Place this note immediately after the `supabase/` tree block, before the next folder block.

### Edit 3 — README: `/rest/v1/` warning in environment variables section

The "Environment variables" section (around line 354) currently shows the `.env.local` template with `NEXT_PUBLIC_SUPABASE_URL=` having no annotation. Add a warning callout immediately below the code block, like:

> ⚠️ **Heads up on `NEXT_PUBLIC_SUPABASE_URL`:** Use the bare project URL with no path — `https://<ref>.supabase.co` — never `https://<ref>.supabase.co/rest/v1/`. The `supabase-js` client appends `/rest/v1/` itself; including it in the env var causes doubled paths and 404s on every query. The Supabase dashboard's "Connect" or "REST API" view sometimes shows the URL with `/rest/v1/` already appended; strip it on paste.

### Edit 4 — README: editor backup file warning, same section

Add a second short callout below the `/rest/v1/` warning:

> ⚠️ **Editor backups when editing `.env.local`:** nano writes `.env.local.save`, vim writes `.env.local~` and `.env.local.swp`, etc. These are backup files containing secrets and must never be committed. The repo's `.gitignore` blocks `.env*.save`, `.env*~`, `.env*.swp`, and `.env*.bak` patterns to belt-and-suspenders this. If your editor uses a different backup convention, add it to `.gitignore`.

### Edit 5 — README: pointer to platform-notes.md

In the folder structure section's `docs/` block, add `platform-notes.md` as a child:

```
├── docs/
│   ├── faceless-edtech-strategy.md
│   ├── faceless-toolkit.md
│   ├── curriculum-ideas.md      # API keys topic captured
│   └── platform-notes.md        # Operational gotchas (CLI quirks, edge cases)
```

Also add a short pointer line near the top of the README, perhaps right after the source-of-truth statement at the top, or as a one-line section:

> Operational gotchas and platform-specific quirks (Supabase CLI behaviors, dotenv noise, etc.) are tracked in `docs/platform-notes.md`. Reference there before assuming a CLI command works the way docs say it does.

Pick a placement that flows naturally — show me where in the plan walkthrough.

### Edit 6 — Create new file `docs/platform-notes.md`

This file captures operational learnings from Phase 2b.1. Format mirrors the existing docs/ pattern (lightweight markdown, sections, dated entries).

Content structure:

```markdown
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
- Recent `dotenv` versions inject a one-line "tip: ▸ auth for agents [www.vestauth.com]" message on every `config()` call.
- Cosmetic only. Doesn't affect env loading. Will appear unprompted in CI logs.
- Silenceable via `dotenv.config({ path: '.env.local', debug: false })` — note the `debug: false` is what suppresses the tip on recent versions.
- We left it on for now. If CI logs get noisy, flip it.
```

---

## After the plan walkthrough

Once I approve the plan:

1. Create the new file `docs/platform-notes.md` with the content above. Use `Write` tool, single create operation. Ask for approval (option 1, never 2 — discipline).

2. Apply the five README edits via individual `str_replace` calls. Each str_replace gets its own approval prompt. Do NOT batch them — five separate gates.

3. After all six edits land, run verification:
   - `git diff --stat` — should show README.md and docs/platform-notes.md as the only changed files
   - `wc -l docs/platform-notes.md` — should match expected length (whatever it ends up being, just report it)
   - `grep -c "2b.1" README.md` — count substep references to confirm the tick-and-mark-done landed
   - `grep -c "platform-notes" README.md` — should be 2 (folder structure listing + the pointer line)

4. Commit with explicit paths:
```
git add README.md docs/platform-notes.md
git commit -m "Phase 2b.1.8: End-of-substep README + platform notes sweep"
```

5. After the commit, run:
   - `git log --oneline -10` — full chain of 2b.1 commits visible
   - `git status` — working tree clean, 9 commits ahead of origin/master

Stop after the commit. Do NOT push to origin yet — Baz will approve the push as a separate step after reviewing the commit.

## Discipline reminders

- Pause-and-approve every individual edit (option 1, never option 2)
- One str_replace per edit, no batching
- Explicit paths in git add — no `git add .`
- New-file verification on `docs/platform-notes.md` before committing (cat -n + wc -l + head -1 + tail -1 + a distinctive grep)
- README is ground truth — if something in the plan above feels off when you read the actual README, push back BEFORE writing

## Out of scope

These are tracked but NOT part of this commit:
- Phase 2b.2 planning (next session)
- Pushing to origin (separate step after this commit)
- Updating `lib/supabase.ts` schema-deployed comment (deferred from earlier — actually, was it ever updated when we typed the client? Check `lib/supabase.ts`. If the comment "DB client (connected, schema not deployed yet)" is still there in the README's folder structure block, fix THAT as part of this sweep — it's stale now. Add it as Edit 5.5 if applicable; flag it in your plan walkthrough.)

Walk me through the plan first. Do not write anything.
