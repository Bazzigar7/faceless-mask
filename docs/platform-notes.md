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

### Byte-equality snapshot regen recipes preserved in freeze commit (Phase 3.3.2, 2026-05-19)
- For byte-equality contracts (e.g. `tests/snapshots/mask-system-prompt.txt` enforced by `npm run verify:prompt`), the regen recipe lives **verbatim in the freeze commit's body**, not as a script file in the repo. The 7181415 freeze commit body documents the exact command and the reason for each quirk (e.g. `m.default.MASK_SYSTEM_PROMPT` because tsx's `-e` inline mode wraps named exports through a CJS interop layer).
- Rationale: the absence of a generator script makes the contract intentionally hard to invalidate by re-running the wrong command. Re-reading the freeze commit body is the documented path for any future regen.
- Re-using the documented recipe (vs improvising a shell-redirect one-liner) also guarantees symmetry with the verify script's read path — same encoding, same write mechanism, same module-load path. Improvised one-liners can introduce encoding or line-ending pitfalls.
- Source case: Phase 3.3.2's snapshot re-freeze (6badeba) used the recipe from 7181415's body verbatim. Recipe produced byte-identical output to what `verify-prompt.ts` reads through.

### `verify:*` scripts not wired into CI — runs depend on human discipline (Phase 3.3.2, 2026-05-19)
- `verify:prompt` and `verify:visual` are invoked manually via `npm run`; nothing in CI, pre-push hooks, or the Vercel build step runs them automatically.
- Risk: regression drift survives undetected on `origin/master` until someone next runs the verify locally. Phase 3.3.2's pre-push sanity check caught a three-day-old drift in `tests/snapshots/mask-system-prompt.txt` (stale since f3707ee, 2026-05-15; surfaced 2026-05-18) — invisible during that window because nothing forced the check.
- Mitigation today: include `verify:prompt` + `verify:visual` in any pre-push sanity gate for commits that touch `lib/personality.ts`, `lib/banks/*`, `lib/visualCommands.ts`, or any snapshot/seed fixtures.
- Future hygiene candidate: wire into a pre-push `git` hook or a Vercel build step so the contracts are enforced by the platform, not by memory.

### Terminal output collapse threshold (Phase 3.3.3, 2026-05-20)
- Claude Code's terminal client collapses bash output exceeding ~40 lines behind a "ctrl+o to expand" prompt. Collapsed content is visible in-terminal but NOT included when output is copied into a chat exchange — paste yields only the visible head + collapse marker, losing the rest.
- Symptom: diff inspections of >40-line changes lose the tail; build/test outputs lose route summaries; verify scripts lose pass/fail tails.
- Mitigation 1: pipe through `tail -N` (N=30 or 50) for build/test outputs that end with the summary line. Trades head verbosity for tail visibility.
- Mitigation 2: pre-split diffs via `sed -n 'A,Bp'` into <40-line chunks with explicit STOP-between-chunks pauses, allowing copy-paste of each chunk before the next is generated.
- Mitigation 3 (when a file is untracked, so `git diff` is empty): use `sed -n 'A,Bp' <file> | cat -n` to view a specific line range with line numbers renumbered to the range.
- Source case: Phase 3.3.3 substep — encountered repeatedly during diff inspections of VoiceLoop.tsx (3 hunks, ~71-line cumulative diff). Each inspection used pre-split sed ranges to keep chunks under threshold.

---

## Browser

### Safari microphone permission (Phase 3.3.1 smoke, 2026-05-17)
- Safari requires per-site explicit microphone permission grant. First voice-loop press on a fresh Safari install prompts for mic access; declining or ignoring leaves the voice loop silently non-functional with no in-app error surface.
- Chrome auto-grants for HTTPS sites in many flows; Safari does not.
- Not a regression from any Mask-side change. Worth flagging in any future public-share / classroom-deploy docs.

---

## TypeScript

### tsconfig `target` default is ES3/5; ES2015+ iterators need explicit `target` (Phase 3.3.2, 2026-05-19)
- When `target` is unspecified in `tsconfig.json`, TypeScript 5 defaults to ES3 (or ES5 in some configs) for emit. This blocks `for...of` iteration over standard ES2015+ iterables — `Set`, `Map`, `RegExp.matchAll()` results, and similar — with error TS2802.
- The `lib` array (e.g. `["dom", "dom.iterable", "esnext"]`) brings in **type definitions** for these iterables but does NOT relax **emit/iteration semantics**. They're separate knobs. The type system knows the shape; emit target gates whether `for...of` over those shapes compiles.
- Fix: explicit `"target": "es2020"` (or higher) in `compilerOptions`. The codebase was already written assuming ES2020+ semantics — adding the field surfaces no behavior changes, only removes the TS2802 gate.
- Alternative if you can't bump target: `"downlevelIteration": true` allows `for...of` over the iterables but emits more verbose code. Not needed for modern Next.js / Vercel runtimes.
- Source case: Phase 3.3.2 commit [2] introduced the first project code that iterates `Set` and `matchAll()` results via `for...of` (in `lib/visualCommands.ts`). tsc errored TS2802 at Gate 4. Latent gap; older code happened to avoid these patterns. Fixed in commit 3d0d6ed by adding `"target": "es2020"`.

### Hand-written types drift against generated types until first cross-boundary caller (Phase 3.3.3, 2026-05-20)
- `lib/types.ts` carries hand-written types that claim shapes the DB CAN have but does NOT necessarily enforce. Supabase's `lib/database.types.ts` is generator-faithful to actual DB constraints. When the hand-written type is stricter than the generated type, the drift goes unnoticed until the first caller imports both and TypeScript performs the assignability check.
- Structurally the same drift class as Phase 3.3.2's tsconfig `target` default (latent gap, surfaced when the first consumer used a new pattern — `for...of` over `Set` / `matchAll` for 3.3.2; cross-boundary type assignment for 3.3.3).
- Source case: `Asset` (hand-written 3.3.2) claims `type: 'image' | 'video'`, `url: string`, `tags: string[]`, `added_by: string`, `created_at: string`. Generated types showed `type: string`, `url: string | null`, `tags: string[] | null`, `added_by: string | null`, `created_at: string | null`. The mismatch was invisible until 3.3.3.1's `listAssets` returned `Asset[]` from a `.from('assets').select(...)` chain — tsc errored TS2322. Phase 3.3.1's migration tightened SOME constraints (CHECK on type, NOT NULL on tags) but not all; even then, CHECK constraints don't narrow generated types — only Postgres ENUMs do.
- Mitigation: when adding hand-written types that mirror DB shapes, plan for a boundary-narrowing helper (validator + type predicate) in the loader that first crosses into application code. Don't trust that "the migration will tighten it" — verify against `lib/database.types.ts` and budget for the gap between what migration can enforce and what generator can express.

---

## Git CLI

### `git stash push -- <path>` silently rejects untracked files (Phase 3.3.2, 2026-05-19)
- `git stash push -m "<msg>" -- <path1> <path2>` exits 1 with `pathspec ':(prefix:0)<path>' did not match any file(s) known to git` if any of the listed paths is untracked. No stash entry is created — the whole stash operation aborts; other listed paths (even if tracked + modified) are NOT stashed.
- Workaround 1: `mv <untracked-path> /tmp/<name>.bak` aside before stashing tracked changes, then `git stash pop` and `mv` back. Round-trip preserves the untracked file's bytes but it's never in the stash entry.
- Workaround 2: `git stash push -u -m "<msg>" -- <path>` adds untracked files to the stash entry. The `-u` flag enables the untracked path.
- Source case: Phase 3.3.2 commit [2] Gate 4 isolation check. Wanted to stash `lib/types.ts` (modified) + `lib/visualCommands.ts` (untracked) to baseline-check tsc. Plain `stash push -- both-paths` errored; ended up moving the untracked file aside manually and running tsc with only the modified file in place.

---

## Workflow discipline

### Hygiene commit isolation pattern (Phase 3.3.2, 2026-05-19)
- Latent gaps (config drift, doc drift, stale snapshots, broken assumptions) surface during feature work but ship as standalone `Hygiene: <what>` commits, never bundled into the feature commit they were discovered through.
- Keeps history honest: feature commits stay focused on feature contracts; hygiene commits stay revertable in isolation.
- Discoverable retroactively via `git log --grep="^Hygiene"` — gives a clean inventory of gap-closures separate from feature work.
- Source case: Phase 3.3.2 substep arc shipped 5 commits total — 3 hygiene (94a51e3 README locked-files path drift, 3d0d6ed tsconfig target es2020 added, 6badeba personality.ts snapshot re-freeze) flanking 2 feature commits (8e1f669 pure functions, aaa530f verify harness). Each hygiene commit closed a single specific gap surfaced during the substep gates; bundling any of them into the feature commits would have muddied the substep arc's contract.

### Two-gate vs four-gate workflow cycles (Phase 3.3.2, 2026-05-19)
- Four-gate (audit → plan → execute → verify, each with its own approval stop) stays the default for substantive feature work — anything touching contracts, types, or runtime behavior.
- Two-gate (audit+plan combined, execute+verify+commit combined) authorized in chat per task for small, well-scoped operations: single-file doc edits, config-bump hygiene, snapshot regens, README tracker flips.
- Don't streamline to two-gate without explicit authorization in the prompt. The explicit-permission discipline keeps Claude Code from shortcutting on operations that look small but might surface a gap (cf. Phase 3.3.2's tsconfig commit, which started as a small fix but exposed a latent project-wide config issue).
- Source case: Phase 3.3.2 substep used four-gate for the substep proper (commits [1], [2], [3]) and two-gate for the bracketing hygiene commits ([2a] tsconfig and the followup snapshot re-freeze 6badeba).

### Dead-surface-for-convention gets dropped (Phase 3.3.3, 2026-05-20)
- Every new code surface (import, state, ref, helper) added for "convention" or "symmetry" reasons gets dropped if it has no concrete consumer. Imports are the specific case where `@typescript-eslint/no-unused-vars` from `next/typescript` flags this at the `next build` lint step (tsc itself doesn't catch dead imports). State and refs require plan-gate critique or runtime detection.
- Three-strike pattern from Phase 3.3.3 — same discipline gap in three different shapes:
  - **Strike i** (plan gate): parsed-events queue ref — would have been mutated but never read. Resolution is synchronous, so the matchedAsset state captures the result in the same tick; the queue had no consumer. Dropped before code was written, caught by Q6 dead-state reasoning at plan time.
  - **Strike ii** (execute gate): `assets` useState added at 3.3.3.1 plan gate, dropped after `next build` lint flagged it. Value side was never read; only setAssets was called, and the actual consumer was `assetsRef.current` (which the streaming loop reads bypassing React's render cycle). The state pattern was added for "symmetry with the existing `status` useState" — but `status` has a real read site in `buttonDisabled`; `assets` had none.
  - **Strike iii** (execute gate): `StageEvent` type import added at 3.3.3.2 execute gate, dropped before build after pre-flight `.eslintrc.json` read confirmed `next/typescript` defaults would fire. Narrowing was already inferred from `parseStageTags`'s return type — explicit import was documentation-only.
- Mitigation: pre-execute audit reads `.eslintrc.json` (verifies `argsIgnorePattern` / `varsIgnorePattern` overrides) AND scans the proposed code for at least one concrete consumer per new symbol. If the use site is "inferred from a return type", the import is dead — drop it. From 3.3.3 forward this rule is explicit at plan gates.

### Pivot to boundary-narrow when architecturally-correct path exceeds session budget (Phase 3.3.3, 2026-05-20)
- When audit surfaces more scope than expected (e.g. type-drift gap that "properly" requires DB migration + types regen + multi-table drift handling), prefer the boundary-narrow file-local fix over the architecturally-correct schema work when: (a) hackathon judging or other deadline is in progress, (b) the boundary fix solves the immediate symptom completely (not partially), (c) the architecturally-correct work has clear deferred-session shape.
- Park deferred work as breadcrumb in the commit body for the future dedicated hygiene session. Cite specific commits and the reason for deferring.
- Source case: Phase 3.3.3.1 hit tsc error from Asset-vs-generated-types drift. Initial audit decision was Option 1 (DB constraints + regen). After audit confirmed the gap was wider than expected (NOT NULLs missing on multiple columns, CHECK-doesn't-narrow-generator behavior, full regen would surface drift in other tables), pivoted to Option 3 (boundary-narrow validator in `listAssets`). The 5-line filter solved the immediate problem cleanly; the architecturally-correct work (additional NOT NULLs on url/added_by/created_at, ENUM conversion for the type column, full regen with multi-table drift review) parked as breadcrumb in commit ebc2b8c's body for a future schema-hygiene session.
- Anti-pattern: shipping the boundary-narrow without recording the deferred work means future-you forgets the architectural debt. Commit body archaeology is the proof against this.
