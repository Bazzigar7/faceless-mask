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
| Text-to-speech | ElevenLabs Multilingual v2 | Starter tier ($5/mo) active; Turbo v2.5 flip is unblocked, deferred to its own substep for the latency win. |
| Wake word | Picovoice Porcupine | Free for personal use, runs in browser. Phase 3. |
| Animation | SVG + Tailwind transitions + rAF | Framer Motion not installed; deferred until Mode 2/3 transitions are needed in Phase 3. |
| Hosting | Vercel | Hobby tier; live at https://faceless-mask.vercel.app (shipped May 12, 2026) |

### Known reversals

The stack above reflects what's actually running. Two layers got pivoted during Phase 1 — both are documented here so future sessions know the conditions to flip back.

1. **Deepgram Nova-2 → OpenAI Whisper.** Deepgram login was broken on the `bazaffiliate` account during Phase 1. Whisper handles Indian English and code-mix fine and was a 5-minute swap. Reversal trigger: when streaming STT becomes a priority in Phase 3 (lower latency, partial transcripts for "interruptibility"), revisit Deepgram once auth is resolved. Code path: `app/api/stt/route.ts`.

2. **ElevenLabs Turbo v2.5 → Multilingual v2.** Turbo isn't available on the free tier. Starter tier ($5/mo) is now active as of 2026-05-09, which unblocks the Turbo v2.5 model-string flip in `app/api/tts/route.ts`. The flip itself is unblocked but deferred to a separate substep so the latency win lands as a discrete, measurable change.

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
- `lib/` — pure helpers, hooks, and the personality prompt. Includes the prompt-cache wiring (formatSessionContext, sessionContext), the alignment/viseme primitives (findActiveSentence, useLipSync, useCurrentWord, visemeMapping, wordSegments), Supabase client + types, and the brief-bank parser system under lib/banks/.
- `docs/` — strategy, polish-backlog, curriculum-ideas. Read these to understand company context and what's pending.
- `supabase/` — migrations (4 deployed: initial_schema, test_session_seed, turns_table, assets_tighten_and_seed).
- `scripts/` — smoke tests + the env loader.
- `prompts/` — historical Claude Code prompts used to kick off each phase. Read-only archive.
- `middleware.ts` — root-level Next.js middleware. Basic Auth gate on /admin and /api/admin only (Phase 3.1.2.1).

Forward-looking files not yet built (Phase 3+): stage view components, visual command parser, wake word integration, asset library manager. See Build Phases below for the sequencing.

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

Admin panel (/admin) manages sessions. Asset library and visual content management lives at /library in Phase 3.

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
[Wake word "Hey Mask"]  ←—— Picovoice in browser (Phase 3)
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

1. ElevenLabs Turbo v2.5 on Starter tier (~500-800ms back). One-line flip.
2. Streaming STT (Deepgram return or Whisper streaming alternative) cuts another chunk.
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
  alt_text text,
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

**Row-level security:** RLS is disabled on all tables in V1. Mask is deployed publicly at faceless-mask.vercel.app since Phase 3.1.1 (2026-05-12), and /admin + /api/admin are gated by Basic Auth middleware since Phase 3.1.2.1 (2026-05-15). The single-operator posture remains — RLS gets enabled with per-user policies when Mask Licensing (V2) introduces multi-tenancy.

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
# PICOVOICE_ACCESS_KEY=
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
- [ ] Latency under 2s — *currently ~3s. Starter tier is now active so Turbo v2.5 swap is unblocked; remaining latency wins are Turbo flip + streaming STT in Phase 3.*
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

### Phase 3.3 — Stage View V1 (Solo + Visual modes)
- [x] 3.3.1: Assets table tightened + seeded ✅ shipped 2026-05-17 (commit 0a06cd5)
- [ ] 3.3.2: Stage tag parser + fuzzy asset matcher (lib/visualCommands.ts)
- [ ] 3.3.3: Wire stage event channel via client-side parser in VoiceLoop
- [ ] 3.3.4: Stage component + StageLayout + mode state machine
- [ ] 3.3.5: Idle timeout + explicit hide for stage exit
- [ ] 3.3.6: Replace placeholder assets with curated set (after 3.3.1-3.3.5 build is verified working)

**Hard constraints during Phase 3.3** (relax after 3.3 ships):
- `lib/personality.ts` — locked (controls voice-loop output)
- `app/api/chat/route.ts` — locked per Path B decision in 3.3.1 (3.3.3 parses stage tags client-side, not via server stream change)
- `app/api/stt/route.ts`, `app/api/tts/route.ts` — locked (voice-loop runtime)
- `lib/useLipSync.ts`, `lib/visemeMapping.ts`, `lib/findActiveSentence.ts` — locked (lip sync runtime)
- `components/VoiceLoop.tsx` — additive only (new state + client parser; no removal of existing state or props)

After Phase 3.3 closes, these files return to normal review-and-edit cadence; the lockout is specifically for the hackathon-judging window plus the duration of the Phase 3.3 substeps.

### Phase 3 — remaining (post-3.3)
- [ ] Phase 3.4 — Activity mode (Mode 3) — deferred per Phase 3.3 prompt
- [ ] Asset upload UI (app/library/page.tsx)
- [ ] Picovoice "Hey Mask" wake word
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

---

## Scope addition: AI alongside blockchain

Mask is not just a blockchain co-host. Curriculum will cover both AI and blockchain, framed as "modern earning skills." This means Mask's personality, story bank, and activities will expand to include AI topics — Claude Code, vibe coding, AI for content creation, building AI agents, etc.

Curriculum design happens separately (see Faceless EdTech strategy doc). Mask's prompt updates as curriculum grows.
