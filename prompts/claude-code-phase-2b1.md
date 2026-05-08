# Mask Phase 2b.1 — Schema Deployment

You are helping me build Mask, an AI voice co-host for my campus blockchain + AI education sessions in Coimbatore. I am Baz, founder of Faceless. Phase 1 (voice loop) shipped April 30, 2026. Phase 2a (visible Mask + lip sync + karaoke subtitles) shipped May 8, 2026 at commit 4dc8ed4. This is the first substep of Phase 2b.

## Read the spec first

Before writing any code, read these files in order:

1. `README.md` — source of truth for the build
2. `lib/personality.ts` — Mask's personality prompt (don't modify, just understand)
3. `docs/faceless-edtech-strategy.md` — company context (optional)

If anything in this prompt contradicts the README, ask me which is current. The README usually wins — except for the schema block, which is the literal target of step 1 below.

## What's already shipped — don't break it

- Phase 1 voice loop: `app/api/stt/route.ts` → `app/api/chat/route.ts` → `app/api/tts/route.ts`, orchestrated by `components/VoiceLoop.tsx`
- Phase 2a visual: `components/Mask.tsx` (SVG mask with viseme cutouts), `components/Starfield.tsx`, `components/Subtitles.tsx`, `lib/useLipSync.ts`, `lib/useCurrentWord.ts`, `lib/wordSegments.ts`, `lib/visemeMapping.ts`, `lib/types.ts`
- TTS endpoint streams from ElevenLabs `/stream/with-timestamps` as NDJSON
- Subtitles render karaoke-style (current word white, others gray-500), hold previous sentence during inter-sentence gaps
- Lip sync: rAF loop reads `audio.currentTime` against `alignmentStoreRef`, maps active char to one of 6 visemes via `charToViseme`

The voice loop currently lands at ~3 second round-trip. Latency is a known issue — DON'T touch it in this substep. Phase 2b.1 is purely plumbing — schema deployment, type generation, and a smoke test. Zero UI changes. Zero API route changes.

## Phase 2b.1 scope — schema deployed, types generated, smoke-tested

We are building seven micro-steps in sequence. Each one ships green before the next starts. After each step, commit to git with the exact message I specify, then **stop and wait for me to test before moving on**. Do not chain micro-steps without my explicit approval between each.

Pre-flight assumptions (verify these before starting):

- Supabase CLI v2.98.x is installed (`supabase --version` should report 2.98 or higher)
- `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` set with real values for a fresh Mask Supabase project (separate from any other Faceless project)
- Working tree is clean, in sync with origin/master at HEAD 4dc8ed4
- I have the Postgres database password ready in my password manager — you'll need it interactively at step 3

If any of those are wrong, stop and tell me before going further.

---

### Micro-step 2b.1.1 — Update README schema block to match deployment plan

**No code changes yet. README only.** This is first because the README is ground truth for the build. We update it before the SQL gets written so the schema we deploy matches the schema the README describes.

Open `README.md`. Find the "Database schema" section (around line 268). Make these edits to the SQL block and the prose around it:

1. **Drop the `memory` table entirely.** Remove its `create table` statement. Add a one-line note in the prose above the SQL block: "Memory layer for cross-session callbacks is deferred — `sessions.summary` carries the per-session recap, which is enough for V1."

2. **Add `summary text` column to `sessions` table.** Place it after `transcript text` and before `duration_minutes int`. Add a one-line comment in the SQL: `-- Claude-generated end-of-session summary, retrieved next session as context`.

3. **Collapse `approved_openers jsonb` and `approved_activities jsonb` into the existing `brief jsonb` column.** Remove those two columns entirely. Update the prose above the SQL to describe the brief shape: "`brief` stores the full approved bundle as JSONB: `{ openers: [...], activities: [...], stories: [...], notes: string }`. Each item has `text` and `source` fields. The shape evolves without migrations."

4. **Add a "Row-level security" note** as a new short subsection below the SQL block:
   > **RLS note:** Row-level security is disabled on all tables in V1. Mask runs locally on a single user (Baz) with no public-facing API. When the admin route gets a password gate (V2 or when deployed publicly), RLS gets enabled with policies. This decision is documented in the migration file.

5. **Fix the stale `public/` listing in the folder structure section.** Currently it lists `mask-head.svg`, `mask-full.svg`, `mask-lips.svg`. Change it to reflect what's actually on disk: `mask-base.svg`, `mask-eye-holes.svg`, `mask-head.svg`, `mask-lips.svg`. Note `mask-head.svg` is reserved for Phase 3 Mode 2/3 Mask.

6. **Update the folder structure** to add `supabase/` at the top level, listing `config.toml` and `migrations/` as children. Also add `lib/database.types.ts` (generated, not hand-written — note this in the comment) and `scripts/smoke-test.ts`.

7. **Update the "Build phases" section.** Phase 2 is currently a single bucket. Split it:
   - Mark Phase 2a as ✅ shipped May 8, 2026, with checkboxes ticked for: Mask SVG with amplitude-reactive animation, Lip sync (Level 2 — viseme morphing), Subtitles rendering, Real Mask voice auditioned and locked.
   - Rename remaining Phase 2 work to "Phase 2b — Admin + memory + database":
     - [ ] 2b.1: Schema deployed, types generated *(this substep)*
     - [ ] 2b.2: Session context loading
     - [ ] 2b.3: Transcript capture
     - [ ] 2b.4: Admin panel scaffold
     - [ ] 2b.5: Pre-session approval flow
     - [ ] 2b.6: Memory recall

8. **Note Framer Motion is not installed.** In the "locked stack" table, the Animation row currently says "Framer Motion + SVG". Update it to: "SVG + Tailwind transitions + rAF (Framer Motion not installed; deferred until Mode 2/3 transitions are needed in Phase 3)".

After making these edits, walk me through a diff summary (just the conceptual changes, not the literal diff output) before committing.

**Commit:** `Phase 2b.1.1: Update README schema and folder structure for 2b deployment plan`

**Done when:** README's schema block, folder structure, RLS note, and Phase 2 split all reflect the decisions above. Git diff shows only README.md changed.

**STOP. Wait for me to approve before moving to 2b.1.2.**

---

### Micro-step 2b.1.2 — supabase init

Run `supabase init` from the project root.

This creates:
- `supabase/config.toml`
- `supabase/.gitignore`
- `supabase/seed.sql` (empty, fine)
- The `supabase/migrations/` directory may not exist yet — that's fine, step 4 creates the first migration file which auto-creates the directory.

Verification commands to run after init:
1. `ls -la supabase/` — show me the output
2. `cat supabase/.gitignore` — confirm it ignores `.branches/` and `.temp/` (or whatever the CLI generates by default)
3. `cat supabase/config.toml | head -30` — confirm it's a valid config file with project_id, api section, db section

If `supabase init` prompts you to generate VS Code settings or anything else interactive, decline (we don't need IDE config in this repo).

**Commit:** `Phase 2b.1.2: supabase init`

Use these explicit paths in the commit:
```
git add supabase/config.toml supabase/.gitignore supabase/seed.sql
git commit -m "Phase 2b.1.2: supabase init"
```

Do NOT use `git add .`. Explicit paths only.

**Done when:** `supabase/` folder exists with config.toml + .gitignore + seed.sql, all committed.

**STOP. Wait for me to approve before moving to 2b.1.3.**

---

### Micro-step 2b.1.3 — Link to live Mask Supabase project

Extract the project ref from `.env.local`. The ref is the subdomain of `NEXT_PUBLIC_SUPABASE_URL`. For example, if the URL is `https://abcdefghijklmnop.supabase.co`, the ref is `abcdefghijklmnop`.

Show me the extracted ref before running the link command, so I can verify it matches the Mask project.

Then run:
```
supabase link --project-ref <ref>
```

This will prompt interactively for the database password. I'll have it ready in my password manager. **You will not see the password — I type it directly in the terminal.**

After link succeeds, verify with:
1. `supabase status` — should show "Linked to project: <project-name>" or equivalent confirmation
2. `cat supabase/config.toml | grep project_id` — confirm project_id is set in the config

`supabase link` updates `supabase/config.toml`. The config file is safe to commit — it does not contain secrets, only the public project ref.

**Commit:** `Phase 2b.1.3: Link to live Mask Supabase project`

```
git add supabase/config.toml
git commit -m "Phase 2b.1.3: Link to live Mask Supabase project"
```

**Done when:** Project is linked, `supabase status` confirms, config.toml updated and committed.

**STOP. Wait for me to approve before moving to 2b.1.4.**

---

### Micro-step 2b.1.4 — Write the initial schema migration

Run:
```
supabase migration new initial_schema
```

This creates `supabase/migrations/<timestamp>_initial_schema.sql` (the timestamp is the CLI's clock, looks like `20260509054321`).

Open that file and write the schema based on the now-updated README. The schema must include:

1. **Six `create table` statements** in dependency order: `colleges`, `cohorts`, `tracks`, `sessions`, `assets`, `asset_usage`. NO `memory` table (we dropped it).

2. **`sessions` table** must have these exact columns in this order:
   ```
   id uuid primary key default gen_random_uuid(),
   track_id uuid references tracks(id),
   session_number int,
   date timestamptz not null,
   topic text not null,
   brief jsonb,
   transcript text,
   summary text,           -- Claude-generated end-of-session summary, retrieved next session as context
   duration_minutes int,
   highlight_moments jsonb,
   created_at timestamptz default now()
   ```
   No `approved_openers` or `approved_activities` columns — those collapsed into `brief`.

3. **At the end of the migration**, add:
   ```sql
   -- RLS disabled in V1: Mask runs locally on a single user (Baz). 
   -- When admin route gets a password gate (V2 or public deploy), RLS gets enabled with policies.
   alter table colleges disable row level security;
   alter table cohorts disable row level security;
   alter table tracks disable row level security;
   alter table sessions disable row level security;
   alter table assets disable row level security;
   alter table asset_usage disable row level security;
   ```

4. **A comment header at the top of the file**:
   ```sql
   -- Phase 2b.1 initial schema
   -- See README.md "Database schema" section for shape rationale.
   -- Memory table deferred — sessions.summary carries V1 per-session recap.
   ```

After writing the migration, run new-file verification:
1. `cat -n supabase/migrations/<timestamp>_initial_schema.sql` — show me the full file with line numbers
2. `wc -l supabase/migrations/<timestamp>_initial_schema.sql` — line count
3. `head -1 supabase/migrations/<timestamp>_initial_schema.sql` — confirm header comment
4. `tail -1 supabase/migrations/<timestamp>_initial_schema.sql` — confirm last line is the disable RLS for asset_usage
5. `grep -c "create table" supabase/migrations/<timestamp>_initial_schema.sql` — should return 6
6. `grep -c "disable row level security" supabase/migrations/<timestamp>_initial_schema.sql` — should return 6

Show me ALL six verification outputs. Don't skip any. If any count is wrong, fix the file before committing.

**Commit:** `Phase 2b.1.4: Initial schema migration`

```
git add supabase/migrations/<timestamp>_initial_schema.sql
git commit -m "Phase 2b.1.4: Initial schema migration"
```

**Done when:** Migration file exists with all six tables, RLS disabled on each, comment header in place, all six grep counts correct, file committed.

**STOP. Wait for me to approve before moving to 2b.1.5.**

---

### Micro-step 2b.1.5 — Apply the migration to the live project

Run:
```
supabase db push
```

This deploys the migration to the linked Mask project. The CLI will prompt for confirmation before pushing — confirm yes when prompted.

After push completes, verify the schema landed:

1. Run `supabase db dump --schema public --data-only=false 2>&1 | grep -E "^CREATE TABLE"` — should output 6 lines, one per table
2. Or alternatively: `supabase db dump --schema public 2>&1 | grep "CREATE TABLE" | head -20`

If `supabase db dump` requires the database password again, use the same password from step 3.

If `supabase db push` fails for any reason, do NOT proceed. Show me the error output and stop.

**No commit at this step.** This is database state, not code state. Nothing changed in the working tree.

**Done when:** All six tables exist on the live Supabase project, verified via dump grep.

**STOP. Wait for me to approve before moving to 2b.1.6.**

---

### Micro-step 2b.1.6 — Generate TypeScript types from live schema

Run:
```
supabase gen types typescript --linked > lib/database.types.ts
```

This generates a TypeScript file with type definitions for every table. The file should NOT be hand-edited — every regeneration overwrites it.

After generation, run new-file verification:
1. `cat lib/database.types.ts | head -30` — confirm header comment from Supabase + first type definitions
2. `wc -l lib/database.types.ts` — line count (likely 100-300 lines depending on schema complexity)
3. `grep -c "^      colleges:" lib/database.types.ts` — should return 1
4. `grep -c "^      cohorts:" lib/database.types.ts` — should return 1
5. `grep -c "^      tracks:" lib/database.types.ts` — should return 1
6. `grep -c "^      sessions:" lib/database.types.ts` — should return 1
7. `grep -c "^      assets:" lib/database.types.ts` — should return 1
8. `grep -c "^      asset_usage:" lib/database.types.ts` — should return 1
9. `grep -c "^      memory:" lib/database.types.ts` — should return 0 (we dropped it; if this returns >0, the live schema has stale state)
10. `grep "summary" lib/database.types.ts` — should show summary as a `string | null` field on the sessions Row type

Show me ALL ten verification outputs. If any count is wrong (especially #9 — memory should NOT exist), stop and we figure out what went wrong before committing.

Now update `lib/supabase.ts` to import the generated types. The existing client should be augmented to be typed:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

If `lib/supabase.ts` already exists with a different shape, show me the current contents before overwriting. If it doesn't exist, create it.

**Commit:** `Phase 2b.1.5: Generate TypeScript types from live schema`

```
git add lib/database.types.ts lib/supabase.ts
git commit -m "Phase 2b.1.5: Generate TypeScript types from live schema"
```

**Done when:** `lib/database.types.ts` exists with all six tables, no memory table, summary field on sessions, `lib/supabase.ts` typed against the Database type, both files committed.

**STOP. Wait for me to approve before moving to 2b.1.7.**

---

### Micro-step 2b.1.7 — Schema smoke test

Create `scripts/smoke-test.ts`. The script:

1. Imports the typed Supabase client from `lib/supabase.ts`
2. Loads `.env.local` so it can run as a standalone Node script (use `dotenv` if needed — check if it's already in deps; if not, install it as a devDependency: `npm install --save-dev dotenv`)
3. Inserts data in dependency order:
   - One college: `{ name: 'GRD College of Science', city: 'Coimbatore' }` → capture returned id
   - One cohort: `{ college_id: <id>, name: 'GRD Spring 2026' }` → capture returned id
   - One track: `{ cohort_id: <id>, name: 'Blockchain Foundations', total_sessions: 6 }` → capture returned id
   - One session: `{ track_id: <id>, session_number: 1, date: new Date().toISOString(), topic: 'What is blockchain?' }` → capture returned id
4. Reads back the session with a join all the way up (session → track → cohort → college), prints the result with `console.log` formatted readably
5. Cleans up: deletes all four rows it created (in reverse dependency order: session, track, cohort, college)
6. Prints `✓ Smoke test passed` on success or `✗ Smoke test failed: <error>` and exits with code 1 on any error

Use `process.exit(0)` on success and `process.exit(1)` on failure to make the script suitable for CI later.

**Important:** Use the service role key client OR the anon key client? Anon key is fine since RLS is disabled. Use the anon key — same client as the rest of the app. This also verifies that the anon-key path works end-to-end.

After writing the script, run new-file verification:
1. `cat -n scripts/smoke-test.ts` — show full file
2. `wc -l scripts/smoke-test.ts` — line count
3. `grep -c "from '../lib/supabase'" scripts/smoke-test.ts` (or `from '@/lib/supabase'` depending on path style) — should return 1
4. `grep -c "insert" scripts/smoke-test.ts` — should return at least 4 (one per table)
5. `grep -c "delete" scripts/smoke-test.ts` — should return at least 4

Then run the script:
```
npx tsx scripts/smoke-test.ts
```

Expected output:
- Console log of the joined session showing all four levels of data
- `✓ Smoke test passed` at the end
- Exit code 0 (verify with `echo $?` after the script completes)

If any insert fails, the script should fail loudly with a clear error. If cleanup fails, the script should still exit non-zero so we know the database was left in a dirty state (and tell me which rows are still there so I can clean up manually).

**Commit:** `Phase 2b.1.6: Schema smoke test`

```
git add scripts/smoke-test.ts package.json package-lock.json
git commit -m "Phase 2b.1.6: Schema smoke test"
```

(Include `package.json` and `package-lock.json` only if `dotenv` was installed. Otherwise just `scripts/smoke-test.ts`.)

**Done when:** Smoke test runs end-to-end, prints joined data, cleans up, exits 0. Script committed.

**STOP. Phase 2b.1 complete. Wait for my final review before we start planning 2b.2.**

---

## Tech stack — locked, do not substitute

- Frontend: Next.js 14 (App Router) + Tailwind CSS + TypeScript (already set up)
- LLM: Claude Sonnet 4.6 (`claude-sonnet-4-6`) via Anthropic API — DO NOT touch in this substep
- STT: OpenAI Whisper (`whisper-1`) — DO NOT touch in this substep
- TTS: ElevenLabs Multilingual v2 with-timestamps streaming — DO NOT touch in this substep
- Database: Supabase, fresh Mask project linked in step 3
- Hosting: Vercel (still local dev only)

Do not suggest alternatives.

## Critical priorities for this substep

1. **Each micro-step ships independently.** Hard gate between each. I approve before you proceed. Do not chain steps.

2. **Don't break Phase 1 or Phase 2a.** The voice loop must keep working at every step. If you find yourself touching `app/api/*`, `components/VoiceLoop.tsx`, `components/Mask.tsx`, `components/Subtitles.tsx`, or any `lib/use*` hook, stop — you're outside scope.

3. **Explicit paths in every git command.** No `git add .`. No `git add -A`. Each commit lists the exact files added. The discipline is what holds.

4. **New-file verification on every file you create.** cat -n + wc -l + head + tail + grep counts. Show me the output. If any count is wrong, fix before committing.

5. **README is ground truth.** It gets updated FIRST (step 1), then code follows. If we discover during steps 2-7 that the schema needs to change, we update the README before regenerating.

6. **Pause-and-approve every Claude Code edit.** No shift+tab session approval. Each individual file change gets a confirmation prompt.

## How we work

- Walk me through your plan for the current micro-step before writing code. I want to approve the approach.
- Build incrementally within a step. Get one piece working, verify, commit, move to the next.
- After each micro-step ships, stop and let me test before moving to the next.
- If you hit a decision that's not specified here, ask me. Do not assume.
- If you hit an error, do not "try to fix it" by guessing. Show me the error verbatim and we figure out together.

## Success criteria for Phase 2b.1

End of Phase 2b.1, I should be able to:

1. Open `README.md` and see the updated schema, folder structure, RLS note, and Phase 2 split
2. Open Supabase dashboard for the Mask project and see all six tables
3. Open `lib/database.types.ts` and see typed table shapes for all six tables (no `memory`)
4. Open `lib/supabase.ts` and see the typed client
5. Run `npx tsx scripts/smoke-test.ts` and see the joined data printed, then `✓ Smoke test passed`
6. Run `git log --oneline -10` and see six new commits, all on master, all in sync with origin/master

That's Phase 2b.1 done. No app behavior changes — the home page still works exactly as it did before. This is pure plumbing for what comes in 2b.2 onwards.

Let's start with micro-step 2b.1.1 (README updates). Walk me through your planned README edits as a diff summary before writing them.
