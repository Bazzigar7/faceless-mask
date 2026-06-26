# Mask — AI Co-host for Faceless Sessions

> Faceless finally lives up to its name. Mask is the AI that runs alongside Baz in college sessions — voice-first, visually present, multilingual, and a co-host students can actually talk to.

This README is the source of truth. Claude Code reads this on every session. Update it as decisions change.

Operational gotchas and platform-specific quirks (Supabase CLI behaviors, dotenv noise, etc.) are tracked in `docs/platform-notes.md`. Reference there before assuming a CLI command works the way docs say it does.

---

## What Mask is

A voice-first AI co-host for blockchain + AI education sessions. Projected on a TV or projector in the classroom. Students see Mask (an animated mask image with moving lips), hear Mask, and interact with Baz orchestrating the conversation.

Mask is NOT:
- A replacement for Baz teaching
- A general-purpose chatbot
- A customer support agent
- A financial advisor

Mask IS:
- Baz's session co-host
- A storyteller for blockchain history and AI concepts
- A doubt-clearer who makes complex ideas land
- A character with a personality, opinions, and a voice
- The energy to Baz's substance

---

## The job split between Mask and Baz

This is the single most important framing for understanding Mask's role:

- **Baz is the substance** — concepts, depth, credibility, brand
- **Mask is the energy** — laugh, joke, icebreaker, story, callback, vibe

Baz can't do spontaneous well. He's said this himself. Mask exists to fill those gaps. Every session has dead minutes — the opening, after a hard concept, post-lunch slump. Mask owns those minutes.

The best teacher anyone remembers from school is the one who told funny stories that related to the concept. Story → laugh → concept → sticks. Most education skips the first two and wonders why nobody remembers anything. Mask doesn't skip.

---

## The locked stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js 14 + Tailwind + TypeScript | Same as faceless-hub, code reuse |
| Database | Supabase | Already paid for, already integrated |
| LLM | Claude Sonnet 4.6 (`claude-sonnet-4-6`) | Best speed-quality tradeoff for voice. Prompt caching enabled from day 1. |
| Speech-to-text | OpenAI Whisper (`whisper-1`) | Auto-detects code-mix English/Tamil/Hindi. Pivoted from Deepgram in Phase 1 (see Known reversals). |
| Text-to-speech | ElevenLabs Turbo v2.5 | Flipped from Multilingual v2 on 2026-06-08 (Phase 3.2). TTFB ~150ms; Tamil/Hindi confirmed fine. See Known Reversals #2. |
| Wake word | Browser-native Web Speech API (Chrome-only, V1) | Picovoice Porcupine discontinued its free tier (see Known reversals). Web Speech ships V1 hands-free "Hey Mask" activation. ✅ Phase 3.7 (2026-06-03). |
| Animation | SVG + Tailwind transitions + rAF + Framer Motion | Framer Motion 11.18.2 installed in Phase 3.3.4 (commit 5fb081f); drives Stage-view mode transitions (~400ms ease-in-out). |
| Hosting | Vercel | Hobby tier; live at https://faceless-mask.vercel.app (shipped May 12, 2026) |

### Known reversals

The stack above reflects what's actually running. Two layers got pivoted during Phase 1 — both are documented here so future sessions know the conditions to flip back.

1. **Deepgram Nova-2 → OpenAI Whisper.** Deepgram login was broken on the `bazaffiliate` account during Phase 1. Whisper handles Indian English and code-mix fine and was a 5-minute swap. Reversal trigger: when streaming STT becomes a priority in Phase 3 (lower latency, partial transcripts for "interruptibility"), revisit Deepgram once auth is resolved. Code path: `app/api/stt/route.ts`.

2. **ElevenLabs Turbo v2.5 → Multilingual v2 — RESOLVED 2026-06-08 (flipped back to Turbo).** Turbo wasn't available on the free tier, so Phase 1 ran Multilingual v2. Starter tier ($5/mo), active since 2026-05-09, unblocked the swap; Phase 3.2 flipped `app/api/tts/route.ts` back to `eleven_turbo_v2_5`. Tamil/Hindi quality confirmed fine by ear with no regression (Turbo v2.5 is a language superset). TTFB measured ~150ms in Vercel logs — strictly a `model_id` change, so endpoint / `output_format` / useLipSync alignment were unaffected. Code path: `app/api/tts/route.ts`.

3. **Picovoice Porcupine → browser-native Web Speech API (Chrome-only, V1).** Picovoice discontinued its free tier — access is now a manual commercial-approval gate with 7-day trials (terms effective June 30, 2026), which doesn't fit a one-builder classroom project. The Web Speech API (`webkitSpeechRecognition`) ships V1 wake-word activation with no key and no cost, at the cost of being Chrome-only and cloud-based. Reversal trigger: a V2 cross-browser/on-device need — revisit an on-device engine (Vosk, or Porcupine if its access terms change). Code path: `components/WakeWord.tsx`, `types/speech-recognition.d.ts`. Shipped Phase 3.7 (2026-06-03).

---

## Locked design decisions

- **Name**: Mask
- **Repo**: Standalone — `Mask Faceless CoHost` (lives at `/Users/apple/Desktop/Mask Faceless CoHost`)
- **Activation**: Wake word "Hey Mask" + push-to-talk button as backup. Phase 1 is push-to-talk only.
- **Voice personality**: Calm, thoughtful, conversational, with Gen-Z energy
- **Languages**: English, Tamil, Hindi (code-mix)
- **Visual identity**: Faceless's existing mask image (Baz to provide)
- **Lip sync**: Level 2 — viseme morphing through 5-6 mouth shapes
- **Display**: Laptop → projector or TV in classroom
- **Background**: Starry night (matches the Faceless mask image vibe)
- **Stage layout**: Adaptive (mix of cinematic shift + multi-mode)
- **Subtitles**: Always on, styling decided in Phase 2 with real hardware
- **First test audience**: Friends mock session before going live
- **Launch reel**: Baz introduces Mask to the world

---

## Folder structure

The shipped file tree is maintained as ground truth in the repo itself. To inspect:

```bash
find app/ components/ lib/ docs/ supabase/ scripts/ -type f -not -path '*/node_modules/*'
```

For what's architecturally where:
- `app/` — Next.js App Router pages and API routes. `/` is the voice-loop stage. `/admin/*` is the session/track/cohort admin panel (gated by Basic Auth middleware).
- `components/` — UI primitives. VoiceLoop orchestrates the STT → chat → TTS pipeline. Mask renders the animated face. Subtitles renders the karaoke bar.
- `lib/` — pure helpers, hooks, and the personality prompt. Includes the prompt-cache wiring (formatSessionContext, sessionContext), the alignment/viseme primitives (findActiveSentence, useLipSync, useCurrentWord, visemeMapping, wordSegments), Supabase client + types, the brief-bank parser system under lib/banks/, stage-command parsing (visualCommands.ts — parseStageTags + matchAssetByQuery; commandParser.ts — address-gated parseCommand), and asset helpers (createAsset.ts, listAssets.ts).
- `docs/` — strategy, polish-backlog, curriculum-ideas. Read these to understand company context and what's pending.
- `supabase/` — migrations (6 deployed: initial_schema, test_session_seed, turns_table, assets_tighten_and_seed, enable_rls_public_tables, assets_description_and_phrase).
- `scripts/` — smoke tests, the env loader, and fixture harnesses: verify:visual (32 fixtures — parseStageTags + matchAssetByQuery), verify:commands (21 fixtures — parseCommand), verify:prompt (byte-lock).
- `prompts/` — historical Claude Code prompts used to kick off each phase. Read-only archive.
- `middleware.ts` — root-level Next.js middleware. Basic Auth gate on /admin and /api/admin only (Phase 3.1.2.1).

Forward-looking files not yet built (Phase 3+): stage view components, wake word integration. (Visual command parser and asset library admin have shipped — see Build Phases.)

Note: `supabase/seed.sql` is not present. Supabase CLI v2.98+ no longer auto-creates it on `supabase init`. Schema lives in `migrations/`; we don't need a seed file.

---

## Architecture: cohorts, tracks, sessions

Mask works across multiple colleges, multiple cohorts of students, and multiple thematic tracks. Each session knows where it sits.

```
College → Cohort → Track → Session
```

- **College**: GRD, then later other campuses
- **Cohort**: a group of students who go through sessions together (e.g., "GRD Spring 2026")
- **Track**: a thematic series of sessions (e.g., "Blockchain Foundations" — 6 sessions)
- **Session**: a single class within a track

This means Mask can say things like *"Welcome back machis. Last session we set up wallets. Today we send our first transaction. By next session you'll all be on Solana mainnet."*

That's a callback that wouldn't be possible without this structure.

---

## Pre-session approval flow

Admin panel (/admin) manages sessions. Asset library and visual content management is at /admin/assets (upload, list, delete) — consolidated into the admin panel rather than a standalone /library route.

Baz never goes into a session blind. 15-30 minutes before each session, Baz opens the admin panel and sees:

1. **Today's session card** — College / Cohort / Track / Session number / Topic
2. **What was covered last time** — auto-loaded from previous session transcript
3. **3 opener options** — auto-picked based on session type, time, audience, what was used recently
4. **Suggested activities** — 1-2 from the bank, contextual to the topic
5. **Story bank picks** — 2-3 stories Mask is "primed" to tell if cued
6. **Asset library tagged for today's topic** — Baz can add fresh items

For each, Baz **approves, swaps, or writes their own**. One-tap. Takes 3-5 minutes.

The approved set becomes Mask's session context. Mask doesn't randomly throw in untested material.

---

## Voice configuration (ElevenLabs)

The real Mask voice was created via ElevenLabs Voice Design on 2026-05-08 and is locked in `ELEVENLABS_VOICE_ID`. Originally Adam (`pNInz6obpgDQGcFmaJgB`) during Phase 1 development; replaced by the custom Voice Design output on 2026-05-08.

The target profile that informed the Voice Design output:

- **Pitch**: slightly lower than typical AI assistants
- **Pace**: moderate, never rushed
- **Tone**: warm but not bubbly, intriguing not chirpy
- **Accent**: neutral / slight Indian English would be ideal but optional

Voice ID is set in `.env.local` as `ELEVENLABS_VOICE_ID`.

---

## Stage layout — adaptive multi-mode

The classroom display is not a single static layout. It adapts to what's happening in the session. Three modes, smooth transitions between them.

### Mode 1 — Solo (Mask is speaking)
- Mask is centered, larger size
- Subtitles below
- Used when Mask is explaining a concept, telling a story, riffing with Baz, opening the session
- This is the default state

### Mode 2 — Visual (Mask is showing something)
- Mask slides to the right, smaller size
- Stage takes the main center area
- Visual loads with fade-in
- Subtitles continue at the bottom
- Triggered by stage commands: "show them...", "pull up...", "play..."
- When narration of the visual ends, Mask glides back to center (Mode 1)

### Mode 3 — Activity (room is participating)
- Mask shrinks to a small corner presence
- The activity command takes over the screen
- Big text for "BULL!" / "BEAR!" in Bull-Bear game
- Question text + countdown for Speed Round
- Player names + scores for Last Person Standing
- Triggered when Baz calls an activity

### Transitions
- All transitions use Framer Motion, ~400ms ease-in-out
- Mask scales smoothly, never jumps
- Visual fades in over 300ms
- Subtitles persist across modes (never disappear mid-sentence)

### Background
- Starry night (matches Faceless mask image vibe)
- Stars are subtle, slow drift animation
- Background never changes between modes — only foreground composition shifts

### Mask asset states
The canonical render is `mask-base.svg` — Faceless mask + tuxedo body in one composition. `components/Mask.tsx` inlines this and punches viseme + eye holes through it via SVG `<mask>`. This is what ships in Mode 1 today.

For Mode 2/3 (when Mask shrinks to a corner), a head-only crop is available as `mask-head.svg`. Not yet wired — gets used when Mode 2/3 ship in Phase 3. Both assets exist in `public/` on transparent backgrounds.

### Subtitles
- Always on by default (Baz can toggle off in admin if needed)
- Generated from Mask's text response (before TTS) for accurate timing
- Specific styling and placement to be finalized in Phase 2 when tested on real projector / TV
- Must support English, Tamil, and Hindi rendering
- Saved to session transcript automatically — feeds into clips and course material

---

## The voice loop architecture

```
[Wake word "Hey Mask"]  ←—— Web Speech API in browser, Chrome-only (Phase 3.7 ✅)
        ↓                       Phase 1 = push-to-talk button
[Microphone opens, audio streams]
        ↓
[Whisper STT]  ←—— transcribes the recording
        ↓
[Send transcript + session context + memory to Claude API]
        ↓
[Claude streams response]
        ↓
[Parse <stage> tags → trigger visual on stage view]  (Phase 3)
        ↓
[Stream remaining text to ElevenLabs TTS]
        ↓
[Audio plays via MediaSource, viseme state cycles during speech]  (placeholder cycle = Phase 2a.D; real timestamp-driven mapping = Phase 2a.3)
        ↓
[Status returns to "listening", waits for next press / wake word]
```

**Latency budget**: target is total round-trip under 2 seconds from end-of-question to start-of-speech. Phase 1 lands at ~3 seconds — over budget. The path back inside budget:

1. ~~ElevenLabs Turbo v2.5 on Starter tier~~ — **shipped Phase 3.2 (2026-06-08), but it was NOT the bottleneck.** Measured TTS TTFB ~150ms (range ~126–204ms) in Vercel logs. The flip stays for quality/cost headroom; the latency gain was small. Crossed off the list.
2. **Streaming STT** (Deepgram return or Whisper streaming alternative) — now the prime suspect. Whisper today is batch: it waits for the *entire* recording to finish before transcribing, so the full utterance length is dead latency before Claude even starts. This is the next latency fight. Still open.
3. Aggressive prompt caching for system prompt — already enabled, verified working (`cache_read=4420` on subsequent calls).

The 2s target is non-negotiable for live classroom sessions. Phase 1 demoability is fine at 3s. Phase 5 is not.

---

## Database schema

Schema below was deployed via 4 migrations (initial_schema, test_session_seed, turns_table, assets_tighten_and_seed) across Phase 2b.1 + 2b.3 + 3.3.1. Types generated and committed to lib/database.types.ts.

Memory layer for cross-session callbacks lives in `sessions.summary` (text). 2b.6 wires the read + render path; 2c.1 ships the manual writer UI (admin panel edit form) — see Deferred decisions for the auto-writer path.

`brief` stores the approved session prep as JSONB. Current shape (`SessionBrief`, locked in 2b.5.1): `{ openerId?, activityIds?, storyIds?, customNotes? }` — string IDs reference entries in `lib/banks/*.ts`, plus free-form `customNotes` prose. All fields optional; empty object is valid. Legacy free-form briefs (any other shape) still render via JSON dump in formatter + detail view as a transitional bridge; 2b.5.2 server validator now blocks new legacy-shape writes; rendering fallback stays in code as defensive bridge for any pre-validator DB rows.

```sql
-- Colleges
create table colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  contact_dean text,
  created_at timestamptz default now()
);

-- Cohorts (a specific group of students at a college)
create table cohorts (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references colleges(id),
  name text not null,
  start_date date,
  current_strength int,
  notes text,
  created_at timestamptz default now()
);

-- Tracks (a thematic series of sessions)
create table tracks (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id),
  name text not null,
  total_sessions int,
  description text,
  status text default 'active',
  created_at timestamptz default now()
);

-- Sessions (individual classes)
create table sessions (
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
);

-- Asset library
create table assets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'video')),
  url text,
  storage_path text,
  tags text[] not null,
  exact_phrases text[] not null default '{}',
  alt_text text,
  description text,
  added_by text default 'baz',
  created_at timestamptz default now()
);

create index assets_tags_gin on assets using gin (tags);

-- Session-asset usage
create table asset_usage (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  asset_id uuid references assets(id),
  triggered_at timestamptz,
  trigger_phrase text
);
```

**Row-level security:** RLS is enabled on all public tables as of 2026-05-20. Mask is deployed publicly at faceless-mask.vercel.app since Phase 3.1.1 (2026-05-12), so the anon key is visible to any browser visitor. Server-side queries route through lib/supabaseAdmin.ts (service-role key) which bypasses RLS, so /api/* routes, server components, and the admin panel continue working unchanged. The anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) has no policies attached — direct browser access to public tables is blocked entirely. /admin + /api/admin remain gated by Basic Auth middleware (Phase 3.1.2.1, 2026-05-15). Per-user RLS policies arrive with Mask Licensing (V2) multi-tenancy work.

---

## Environment variables

```bash
# .env.local
ANTHROPIC_API_KEY=
OPENAI_API_KEY=                  # for Whisper STT
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=             # custom Voice Design output, locked 2026-05-08 (was Adam during Phase 1 dev)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Phase 3
# PICOVOICE_ACCESS_KEY=         # not used in V1 — wake word ships on the keyless Web Speech API (Phase 3.7); only needed if V2 reverts to Porcupine
# DEEPGRAM_API_KEY=              # if reverting STT (see Known reversals)
```

> ⚠️ **Heads up on `NEXT_PUBLIC_SUPABASE_URL`:** Use the bare project URL with no path — `https://<ref>.supabase.co` — never `https://<ref>.supabase.co/rest/v1/`. The `supabase-js` client appends `/rest/v1/` itself; including it in the env var causes doubled paths and 404s on every query. The Supabase dashboard's "Connect" or "REST API" view sometimes shows the URL with `/rest/v1/` already appended; strip it on paste.

> ⚠️ **Editor backups when editing `.env.local`:** nano writes `.env.local.save`, vim writes `.env.local~` and `.env.local.swp`, etc. These are backup files containing secrets and must never be committed. The repo's `.gitignore` blocks `.env*.save`, `.env*~`, `.env*.swp`, and `.env*.bak` patterns to belt-and-suspenders this. If your editor uses a different backup convention, add it to `.gitignore`.

Account map (which email owns which key) lives in `~/Desktop/mask-accounts.txt`. Keys themselves only live in `.env.local` (gitignored).

---

## Build phases (flexible timing — Baz controls the calendar)

### Phase 1 — Voice loop  ✅ shipped April 30, 2026
- [x] Repo setup, Supabase project connected
- [x] STT → Claude → TTS pipeline working end-to-end
- [x] Personality file loading on every call with prompt caching verified
- [x] First conversation in office (Mask responded in character on first test)
- [ ] Latency under 2s — *Turbo v2.5 shipped (Phase 3.2, 2026-06-08) but TTS TTFB is only ~150ms — not the bottleneck. Remaining win is streaming STT (Whisper is batch). Still over budget.*
- [x] Vercel deploy — live at https://faceless-mask.vercel.app
- [ ] Ship clip recorded and posted *(Recorded 2026-05-09; not posted yet.)*

### Phase 2a — Visible Mask + lip sync  ✅ shipped May 8, 2026
- [x] Real Mask voice auditioned and locked
- [x] Mask SVG rendered on stage *(originally specified as amplitude-reactive animation; delivered as viseme-based architecture — see lip sync below)*
- [x] Lip sync (Level 2 — viseme morphing)
- [x] Subtitles rendering (streaming, karaoke word-tracking)

### Phase 2b — Admin + memory + database
- [x] 2b.1: Schema deployed, types generated ✅ shipped 2026-05-09
- [x] 2b.2: Session context loading ✅ shipped 2026-05-10
- [x] 2b.3: Transcript capture ✅ shipped 2026-05-10
- [x] 2b.4: Admin panel scaffold ✅ shipped 2026-05-10
- [x] 2b.5: Pre-session approval flow ✅ shipped 2026-05-11
  - [x] 2b.5.0: Banks extracted to lib/banks/ ✅ shipped 2026-05-11
  - [x] 2b.5.1: Picker UI + structured brief renderer ✅ shipped 2026-05-11
  - [x] 2b.5.2: Server-side validator ✅ shipped 2026-05-11
- [x] 2b.6: Memory recall ✅ shipped 2026-05-12
  - [x] 2b.6.1: loadPreviousSummary sibling + SessionContext extension ✅ shipped 2026-05-12
  - [x] 2b.6.2: Formatter renders previousSummary at Option A slot ✅ shipped 2026-05-12
  - [x] 2b.6.3: README closes Phase 2b.6 — tracker, prose, deferred WRITE ✅ shipped 2026-05-12

### Phase 2c — Memory writer UI
- [x] 2c.1: Admin panel post-session summary field ✅ shipped 2026-05-12
  - [x] 2c.1.1: validateSummary + SessionContext.summary + PUT route write path ✅ shipped 2026-05-12
  - [x] 2c.1.2: SessionForm Post-session summary textarea at Slot A ✅ shipped 2026-05-12
  - [x] 2c.1.3: Detail view Summary section at slot α ✅ shipped 2026-05-12

### Phase 3.1 — Production deploy + voice-loop hygiene ✅

Shipped May 12-15, 2026. Post-deploy hygiene work that doesn't block but makes the live product presentable.

- [x] Phase 3.1.1 — Vercel Hobby deploy + maxDuration=60 on chat + tts routes (May 12, commit 868d5a1)
- [x] Phase 3.1.2.1 — HTTP Basic Auth middleware gating /admin + /api/admin (May 15, commit 8dbc430)
- [x] Phase 3.1.2.2 — Markdown suppression in personality.ts (May 15, commit f3707ee)
- [x] Phase 3.1.2.3 — Verbosity observation captured to polish backlog (May 15, commit dfdf96a)
- [x] Phase 3.1.2.4 — findActiveSentence helper extracted from useLipSync + useCurrentWord (May 15, commit bc82368)
- [x] Phase 3.1.2.5 — Dead transcript/error UI removed from VoiceLoop (May 15, commit ba81b77)

### Phase 3.2 — Turbo v2.5 latency flip ✅
Shipped 2026-06-08 (flip commit 3a25927 + doc-sweep). TTS model swapped Multilingual v2 → Turbo v2.5 on the paid Starter tier (see Known Reversals #2). Strictly a `model_id` change — endpoint, `output_format`, and useLipSync NDJSON alignment all unaffected; Turbo is a language superset so Tamil + Hindi confirmed fine by ear.
- [x] `model_id` flip in `app/api/tts/route.ts` (now re-locked)
- [x] Smoke: Tamil/Hindi quality confirmed, lip sync intact, stage tags fire
- [x] Temp TTFB instrumentation added for measurement, then removed in doc-sweep
- **Finding:** TTS TTFB ~150ms (range ~126–204ms) in Vercel logs — TTS is NOT the latency bottleneck. The remaining path to <2s is streaming STT (Whisper is batch; it waits for the full recording before transcribing). Streaming STT stays open under Phase 3 remaining.

### Phase 3.3 — Stage View V1 (Solo + Visual modes)
- [x] 3.3.1: Assets table tightened + seeded ✅ shipped 2026-05-17 (commit 0a06cd5)
- [x] 3.3.2: Stage tag parser + fuzzy asset matcher (lib/visualCommands.ts) ✅ shipped 2026-05-18 — 5-commit arc `94a51e3..6badeba` (2 feature + 3 hygiene)
- [x] 3.3.3: Wire stage event channel via client-side parser in VoiceLoop ✅ shipped 2026-05-20 — 2-commit arc `ebc2b8c..fd2d839`
  - [x] 3.3.3.1: Asset fetch — /api/assets route + lib/listAssets.ts + VoiceLoop fetch on mount ✅ shipped 2026-05-20 (commit ebc2b8c)
  - [x] 3.3.3.2: parseStageTags + matchAssetByQuery wired into VoiceLoop streaming loop ✅ shipped 2026-05-20 (commit fd2d839)
- [x] 3.3.4: Stage component + StageLayout + mode state machine ✅ shipped 2026-05-24 — 3-commit arc `5fb081f..497ef39` (framer-motion install + modeStateMachine + Stage live)
- [x] 3.3.5: Stage emission unlock — <stage> contract reconciled in personality.ts + parser hardened ✅ shipped 2026-05-25 — 2-commit arc `03ef74c..7b218cf` (parser whitespace/case tolerance + personality emission contract + asset whitelist)
- [x] 3.3.6: Idle timeout — Visual auto-exits to Solo after 10s idle ✅ shipped 2026-05-25 (commit 30fa2db). *(10s `STAGE_IDLE_TIMEOUT_MS` timer removed in deterministic trigger commit 3 `1a7ee7f` 2026-06-26 — stage now persists until explicit voice-clear or replacing show.)*
- [ ] 3.3.7: Replace placeholder assets with curated set (also re-sync the personality.ts asset whitelist to the new tags)

### Asset library CRUD ✅ (2026-06-24)
- [x] Asset schema extended — added `description` (text, nullable) + `exact_phrases` (text[], not null, default '{}') columns via migration `20260624000000_assets_description_and_phrase.sql`; types synced in `lib/database.types.ts` and `lib/types.ts` — `57e882b`
- [x] Asset upload endpoints — `/api/admin/assets/sign` mints a signed storage URL (service-role); browser uploads direct via `supabase.storage.uploadToSignedUrl`; `/api/admin/assets` records the row with public URL derived via synchronous `getPublicUrl`. `lib/createAsset.ts` mirrors createSession pattern — `ae589f0`
- [x] Asset admin UI — `app/admin/assets/` (list with preview, tags, exact phrases, description) + `app/admin/assets/new/` (upload form, phase labels, orphan-case message) — `2725541` + build fix `b29b4a8`
- [x] Asset delete — `app/api/admin/assets/[id]` DELETE: file-first ordering (storage remove before row delete; partial failure leaves visible retryable row); `components/DeleteAssetButton.tsx` confirm + refresh — `ca65b75`

### Deterministic voice trigger — commits 1–3 shipped 2026-06-26; grounded-explanation commits 1+2a shipped 2026-06-27; commit 4 + grounded-explanation 2b pending
- [x] `matchAssetByQuery` exact_phrases tier — Tier 1 normalized equality check against `asset.exact_phrases` before Tier 2 fuzzy tag scoring; `normalizePhrase()` applied to both sides; verify:visual 28→32 fixtures — `e5eabd7`
- [x] `parseCommand(transcript)` — address-gated deterministic classifier: ADDRESS_WORDS required at transcript start (anti-false-fire gate); accepts post-address punctuation (Whisper period/comma/etc); SHOW_VERBS strip + light article strip yields query; CLEAR_PHRASES; vocabulary in editable arrays; `lib/commandParser.ts`; verify:commands 16 fixtures incl. no-address negatives + word-boundary rejection — `b3ad066`
- [x] `parseCommand` wired into VoiceLoop — intercepts transcript after STT, before chat call (parallel to Claude speech, not a bypass); show → `matchAssetByQuery` → `onStageChange`; clear → `onStageChange(null)`; none → falls through to Claude unchanged. Dual `matchedAsset` state collapsed: VoiceLoop's local copy removed, `page.tsx` is single source of truth via `onStageChange` callback. 10s `STAGE_IDLE_TIMEOUT_MS` auto-clear removed — stage persists until explicit voice-clear or replacing show. `parseStageTags` still strips `<stage>` from spoken/subtitle text (safety net until personality.ts emission is neutered). Normalization added to `parseCommand`: hyphen/dash→space (Whisper emits "pull-up" for "pull up") + trailing terminal-punctuation strip (Whisper emits "Mask, clear the stage." with period); `verify:commands` 16→21 fixtures — `1a7ee7f`
- [x] `parseCommand` explain signal — `StageCommand` gains `explain: boolean` on show variant + bare `{ command: "explain" }` type; `EXPLAIN_TAILS` (17 entries, longest-first) strips trailing explain clauses from show queries; `BARE_EXPLAIN_PHRASES` (13 entries) matches addressed bare explain after address gate; `verify:commands` 21→27 fixtures — `7931427`
- [x] VoiceLoop 6-way intercept branch — `parseCommand` reordered above `initMediaSource` (silent-video path returns before pipeline opens; `finally` still fires → `setStatus("idle")`, no explicit teardown); `stagedAssetRef = useRef<Asset | null>(null)` tracks currently-staged asset for bare `explain` lookup in commit 2b; `SHOW_ACKS`/`CLEAR_ACKS` canned-ack rotations; silent early-return for `show + video + !explain`; explain=true falls through to chat fetch. Smoke: image-show ack / clear-ack / show+explain / normal ✅ ears-proven. **Silent-video: code-proven, NOT live-smoked (SMOKE-PENDING — cold dev-server restart required, `assetsRef` caches at mount time)** — `68ee4ec`
- [ ] Neuter `<stage>` emission in `personality.ts` — downgraded to pure cleanup (parser is already sole stage owner; `parseStageTags` strips any leaked tag from TTS/subtitles as safety net)

**Banked (vocabulary-robustness slice):** wrong-script Whisper transcription of code-mix speech, misheard words, rephrasing outside fixed verb/phrase lists. Operational gotcha until this slice lands: spoken phrase must match tagged `exact_phrases`; tag assets generously.

**Next priority:** grounded-explanation commit 2b — inject `stagedAssetRef.current.description` into chat route via messages array (NOT system blocks — would bust prompt cache every turn the staged asset changes); inject between history spread and user turn; route body needs new optional `assetDescription?: string` field from VoiceLoop. Prerequisite: smoke silent-video path first (cold-restart dev server, real video asset, say trigger → confirm silent, wake-word re-arms). Then: trigger cleanup commit 4 (`personality.ts` `<stage>` emission neuter). **Lesson — stale-assetsRef:** VoiceLoop fetches `/api/assets` once on mount; DB rows added after dev-server start are invisible until cold restart (not just browser reload).

**Hard constraints during Phase 3.3** (relax after 3.3 ships):
- `lib/personality.ts` — locked (controls voice-loop output)
- `app/api/chat/route.ts` — locked per Path B decision in 3.3.1 (3.3.3 parses stage tags client-side, not via server stream change)
- `app/api/stt/route.ts`, `app/api/tts/route.ts` — locked (voice-loop runtime)
- `lib/useLipSync.ts`, `lib/visemeMapping.ts`, `lib/findActiveSentence.ts` — locked (lip sync runtime)
- `lib/supabaseAdmin.ts`, `lib/supabase.ts` — locked (Supabase security model finalized 2026-05-20; service-role bypass + anon client, do not touch)
- `components/Mask.tsx`, `components/Subtitles.tsx`, `components/Starfield.tsx`, `components/StatusIndicator.tsx` — locked (voice-loop render components; Mode 2 layout shifts happen via parent-supplied className/wrapper, never by editing these)
- `components/VoiceLoop.tsx` — additive-only gate CLOSED by deterministic trigger commit 3 (`1a7ee7f`); returns to normal review-and-edit cadence

After Phase 3.3 closes, these files return to normal review-and-edit cadence; the lockout is specifically for the hackathon-judging window plus the duration of the Phase 3.3 substeps.

### Phase 3.5 — Interrupt engine (stop Mask mid-speech)
- [x] 3.5.1: Engine internals — AbortController + audio-end-resolve ref (dormant) ✅ shipped 2026-05-25 (commit 0db55fe)
- [x] 3.5.2: Temp trigger — button doubles as Stop during speaking ✅ shipped 2026-05-25 (commit ecc0f3a)
- [ ] Wake-word trigger ("Hey Mask stop") — deferred to the wake-word phase (replaces the temp button trigger)

### Phase 3.6 — Within-session conversational memory
- [x] Last 8 turns (HISTORY_TURN_LIMIT) read from the turns table, prepended to the messages array ✅ shipped 2026-05-25 (commit fa13d89)
- [x] Server-side (reuses Phase 2b.3 turn persistence); load-before-write closes the double-count; system-block cache prefix preserved
- [x] Interrupted turns write an [interrupted] marker only when text actually streamed

### Phase 3.7 — Wake word V1 (hands-free activation) ✅
Shipped 2026-06-03, production-verified on faceless-mask.vercel.app. Engine pivot from Picovoice to the browser-native Web Speech API (Chrome-only V1) — see Known reversals.
- [x] 3.7 (1/2): `components/WakeWord.tsx` — Web Speech API listener (`webkitSpeechRecognition`, continuous, status-gated to idle, onend keep-alive restart, one-time "Arm wake word" gesture); detection-only, logs on "hey mask" (final-result match). Ambient `types/speech-recognition.d.ts`. ✅ shipped 2026-06-03 (commit a6d1df6)
- [x] 3.7 (2/2): Hands-free activation — onWake → `startRecording(true)`; end-of-speech auto-stop via `lib/silenceDetector.ts` (Web Audio AnalyserNode RMS VAD, ~1.3s sub-threshold after a speech-started latch) + `MAX_RECORDING_MS` (15s) ceiling backstop. Hands-free only — push-to-talk button behavior unchanged. ✅ shipped 2026-06-03 (commit 80fe525)
- [ ] Wake-word stop trigger ("Hey Mask stop") — still deferred; Phase 3.5 temp button-trigger remains (see Phase 3.5)
- [ ] Follow-up conversation mode — see Deferred decisions

### Phase 3.7.1 — Wake word re-arm reliability ✅ (2026-06-11)
Live testing surfaced the wake word going deaf — after one turn, after an interrupt, and after idle silence. Three commits this session fixed it, root-caused gate-by-gate:
- [x] Revert the "mask abort" detection probe (Phase 3.5.3.1, commit 32ce306) — `fa79833`. A second `SpeechRecognition` (AbortListener, speaking-gated) collided with WakeWord on the `speaking→idle` handoff: Chrome allows one live recognizer and `abort()` is async, so `WakeWord.start()` fired while AbortListener was still capturing → throw → permanent death. Probe PARKED, not abandoned (revisit voice-abort once the close-mic rig arrives; the R400 clicker may be the better abort trigger anyway).
- [x] Self-healing re-arm — `6aa196b`. A single `tryStart()` replaces every bare `recognition.start()`; a thrown `InvalidStateError` schedules a backed-off retry (150ms→1000ms cap) instead of dying. `runningRef` guards the async `start()→onstart` gap against double-start; a one-time `console.warn` after 5 consecutive failures makes a genuinely stuck recognizer (mic revoked / device gone) visible instead of silent.
- [x] Re-arm on `onerror`, not just `onend` — `8793e17`. Final root cause of deaf-after-interrupt **and** deaf-after-90s-idle: a session ends via `onerror` (`no-speech`) with NO following `onend`, so `runningRef` stayed pinned true and the re-arm guard blocked every restart. `onerror` now clears the flag and re-arms (coalesced with `onend` through the shared timer, so at most one `start()` fires); terminal mic-permission errors (`not-allowed` / `service-not-allowed`) warn + stop instead of looping. **Confirmed by smoke across all three paths: multi-turn hands-free, interrupt-then-wake, and 90s+ idle-then-wake all re-trigger.**

> **Durable lesson — Chrome Web Speech API:** a recognition session can end via `onerror` (e.g. `no-speech`) with **no** following `onend`. Never key recognizer cleanup or re-arm solely on `onend` — reset state on `onerror` too. Reusable for any future recognition work (always-on listening mode, V2 on-device engines).

### Voice discipline + topic-agnostic banks ✅ (2026-06-15)
- [x] Verbosity fix + topic-agnostic voice + AI/content banks — `6e1186e` added per-category length budgets and a topic-agnostic "what you teach" framing → `243c738` replaced the time-based budgets with a one-idea / one-example / hand-back / wait rhythm (a model can't sense clock-time) plus Hard rule 9 (stop-on-question) → `dfb5909` broadened the joke bank (30→36, new `ai` + `content` categories) and story bank (9→13) beyond crypto. Personality snapshot re-frozen across the three commits: 18,828/305 → 23,433/352 bytes/lines.

### Phase 3 — remaining (post-3.3)
- [ ] Phase 3.4 — Activity mode (Mode 3) — deferred per Phase 3.3 prompt
- [x] Asset upload/list/delete UI — shipped at app/admin/assets/ (not app/library/) — see Asset library CRUD above
- [x] "Hey Mask" wake word — shipped as Phase 3.7 (Web Speech API, not Picovoice; 2026-06-03)
- [ ] Streaming STT (revisit Deepgram or Whisper streaming)
- [ ] Quiz generator from transcript

### Phase 4 — Mock + polish
- [ ] Full mock session with friends
- [ ] Iterate on awkwardness
- [ ] Brief the dean
- [ ] Cut the launch reel

### Phase 5 — Live in classroom
- [ ] First real session with Mask
- [ ] Capture, clip, post
- [ ] Weekly iteration cycle

---

## Content commitments

Mask's build is content. Each phase ships at least one X post + one short clip.

- Phase 1 ship: "Day 1 of Mask. Faceless gets a face." + voice loop demo
- Phase 2 ship: "Mask now has lips. Watch this." + lip sync demo
- Phase 3 ship: "Mask, show them the pizza story." + stage view demo
- Phase 4 ship: "First mock session with Mask. Friends were unprepared." + reaction reel
- Phase 5 ship: Launch reel — Baz introduces Mask to the world

---

## Non-negotiables

1. **Mask is not a chatbot.** It's a character. Personality > capability.
2. **Voice latency is sacred.** Anything over 2s breaks the magic in live sessions. Optimize relentlessly. (Phase 1 lands at 3s — fine for demo, must be fixed before Phase 5.)
3. **Mask never gives financial advice.** Hard rule. Bybit, Mudrex etc. trust Faceless because we don't shill.
4. **The build is content.** Don't let a phase ship without a post.
5. **Faceless's moat is real students.** Mask runs alongside Baz. It does not replace him.
6. **Pre-session approval is required.** Baz controls what Mask says first.

---

## What's NOT in V1

- Multiple voice options (one Mask, one voice)
- Mobile responsive (this is a classroom display app, desktop only)
- User accounts beyond Baz's admin login
- Analytics dashboard (use Supabase queries directly)
- API for other campuses (V2 — Mask Licensing)
- Student-facing tools (script writer, video helper, captions, campaign briefs, personal Mask access between sessions). Explicitly out of V1. Capture ideas in `faceless-toolkit.md` based on real session observations. Build as a separate product after Phase 5 ships. Mask V1 is a co-host, not a Swiss Army knife.

V1 is for one user (Baz) running sessions at GRD. Everything else comes after we prove the model.

---

## Deferred decisions

Items that are part of V1 by design but have a known follow-up path. Not the same as "What's NOT in V1" — these are explicitly half-shipped, with the rest deferred until evidence warrants the next move.

### Auto-summary writer (Phase 2b.6)

`sessions.summary` is read at session-load time and rendered into Mask's context as "Last session: …" callbacks. The READER + RENDER sides shipped in 2b.6.1 and 2b.6.2. The WRITER is currently manual — Baz types the recap into the admin panel's per-session edit form (shipped 2c.1, 2026-05-12). The auto-writer path stays deferred.

Three candidate shapes for an auto-writer, all viable from the existing chat-route architecture (the `finalMessage().then` post-stream hook is the natural extension point):

1. **Per-turn**: every assistant turn updates `sessions.summary` to a rolling recap. Cheapest infra, highest cost (extra Claude call per turn or summarize-from-current-turn inline).
2. **End-of-session**: a "session ended" event triggers a one-shot summarizer that reads the full `turns` table and writes summary once. Cheaper at runtime, but requires defining "session end" — nothing in the chat-route or UI signals it today.
3. **On-next-load**: when session N loads, if session N-1's `summary` is NULL but its `turns` rows exist, summarize on-the-fly and backfill. Self-healing, but the read path becomes write-capable (subtle trust/idempotence concerns).

Reconsider triggers:
- Baz tires of manual entry (volume signal — likely once cohort count or session frequency makes manual untenable)
- Mask Licensing requires per-tenant auto-summary (V2 product signal — multi-tenant means manual doesn't scale)

### Wake word V2 — cross-browser + on-device (Phase 3.7 shipped V1)

V1 wake word ("Hey Mask" hands-free activation) shipped on the browser-native Web Speech API — Chrome-only and cloud-based (see Known reversals for the Picovoice pivot). V2 PLAY: revisit a cross-browser, on-device engine — Vosk (offline, open-source), or Porcupine if Picovoice's access terms change. Reconsider trigger: a non-Chrome display target, an offline/privacy requirement, or Picovoice's free tier returning.

### Follow-up conversation mode (next phase)

Today each turn needs a fresh "Hey Mask" (or button press). FOLLOW-UP: after Mask finishes answering, re-open the mic for a short follow-up window so the user can continue without re-saying the wake word. To design: the window's exit conditions (silence timeout vs an explicit "thanks Mask"/stop phrase), and guarding against self-trigger (Mask's own TTS re-arming the mic). Builds on the Phase 3.7 silence detector + status-gate. Next phase.

---

## Scope addition: AI alongside blockchain

Mask is not just a blockchain co-host. Curriculum will cover both AI and blockchain, framed as "modern earning skills." This means Mask's personality, story bank, and activities expand to include AI topics — Claude Code, vibe coding, AI for content creation, building AI agents, etc. As of 2026-06-15 the joke bank (new `ai` + `content` categories) and the story bank have expanded to AI/content; activities remain pending.

Curriculum design happens separately (see Faceless EdTech strategy doc). Mask's prompt updates as curriculum grows.
