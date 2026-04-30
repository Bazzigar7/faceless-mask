# Mask — AI Co-host for Faceless Sessions

> Faceless finally lives up to its name. Mask is the AI that runs alongside Baz in college sessions — voice-first, visually present, multilingual, and a co-host students can actually talk to.

This README is the source of truth. Claude Code reads this on every session. Update it as decisions change.

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
| Frontend | Next.js 14 + Tailwind | Same as faceless-hub, code reuse |
| Database | Supabase | Already paid for, already integrated |
| LLM | Claude Sonnet 4.6 (`claude-sonnet-4-6`) | Best speed-quality tradeoff for voice |
| Speech-to-text | OpenAI Whisper (`whisper-1`) | Multilingual incl. Tamil/Hindi code-mix; swapped from Deepgram during Phase 1 build (see note below) |
| Text-to-speech | ElevenLabs Turbo v2.5 | Custom voice, low latency |
| Wake word | Picovoice Porcupine | Free for personal use, runs in browser |
| Animation | Framer Motion + SVG | Mask image with separated lip layer |
| Hosting | Vercel | Free tier, same workflow as faceless-hub |

> **Note (STT pivot):** Originally specced as Deepgram Nova-2; swapped to OpenAI Whisper during Phase 1 because Deepgram login was broken on Baz's account. Reversible — the API contract on `/api/stt` is identical, swapping back is a route-handler change only.

---

## Locked design decisions

- **Name**: Mask
- **Repo**: Standalone — `faceless-mask`
- **Activation**: Wake word "Hey Mask" + push-to-talk button as backup
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

```
faceless-mask/
├── app/
│   ├── page.tsx                 # Stage view — main classroom display
│   ├── admin/page.tsx           # Pre-session brief + approval panel
│   ├── library/page.tsx         # Asset library manager
│   ├── tracks/page.tsx          # Curriculum + cohort manager
│   └── api/
│       ├── stt/route.ts         # Deepgram streaming endpoint
│       ├── chat/route.ts        # Claude API endpoint with system prompt
│       ├── tts/route.ts         # ElevenLabs streaming endpoint
│       └── session/route.ts     # Session CRUD + memory
├── components/
│   ├── Mask.tsx                 # The animated mask SVG component
│   ├── Stage.tsx                # Asset rendering area
│   ├── StageLayout.tsx          # Adaptive layout controller (solo/visual/activity)
│   ├── ActivityRunner.tsx       # Big-text activity display (Bull/Bear, Speed Round)
│   ├── Subtitles.tsx            # Live subtitle rendering
│   ├── Starfield.tsx            # Animated background
│   ├── VoiceLoop.tsx            # Wake word + STT + TTS orchestration
│   └── StatusIndicator.tsx      # Listening / thinking / speaking
├── lib/
│   ├── personality.ts           # Mask's system prompt (THE BRAIN)
│   ├── visualCommands.ts        # Parser for "show", "pull up", "play"
│   ├── activityCommands.ts      # Parser for "Mask, run Bull Bear" etc.
│   ├── memory.ts                # Cross-session memory layer
│   ├── modeStateMachine.ts      # Solo / Visual / Activity transitions
│   └── supabase.ts              # DB client
├── public/
│   ├── mask-head.svg            # Just the face (for smaller sizes)
│   ├── mask-full.svg            # Mask + tuxedo body (for larger sizes)
│   └── mask-lips.svg            # Lips layer (animated, separate from face)
└── README.md                    # This file
```

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

We will audition voices in Phase 1. Target profile:

- **Pitch**: slightly lower than typical AI assistants
- **Pace**: moderate, never rushed
- **Tone**: warm but not bubbly, intriguing not chirpy
- **Accent**: neutral / slight Indian English would be ideal but optional

Voice ID gets set in `.env.local` as `ELEVENLABS_VOICE_ID`.

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
We need two versions of the mask image:
- **Mask only** (head/face) — used in Mode 2 and 3 when smaller
- **Mask + tuxedo body** — used in Mode 1 when centered and larger

The system picks based on size threshold. Designer needs to provide both versions on transparent backgrounds.

### Subtitles
- Always on by default (Baz can toggle off in admin if needed)
- Generated from Mask's text response (before TTS) for accurate timing
- Specific styling and placement to be finalized in Phase 2 when tested on real projector / TV
- Must support English, Tamil, and Hindi rendering
- Saved to session transcript automatically — feeds into clips and course material

---

## The voice loop architecture

```
[Wake word "Hey Mask"]  ←—— Picovoice in browser
        ↓
[Microphone opens, audio streams]
        ↓
[Deepgram STT]  ←—— transcribes in real-time
        ↓
[Send transcript + session context + memory to Claude API]
        ↓
[Claude streams response]
        ↓
[Parse <stage> tags → trigger visual on stage view]
        ↓
[Stream remaining text to ElevenLabs TTS]
        ↓
[Audio plays through speaker, lips animate via amplitude analysis]
        ↓
[Status returns to "listening", waits for next wake word]
```

**Latency budget**: total round-trip under 2 seconds from end-of-question to start-of-speech. Streaming is critical at every layer.

---

## Database schema

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
  approved_openers jsonb,
  approved_activities jsonb,
  transcript text,
  duration_minutes int,
  highlight_moments jsonb,
  created_at timestamptz default now()
);

-- Asset library
create table assets (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  url text,
  storage_path text,
  tags text[],
  alt_text text,
  added_by text,
  created_at timestamptz default now()
);

-- Session-asset usage
create table asset_usage (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  asset_id uuid references assets(id),
  triggered_at timestamptz,
  trigger_phrase text
);

-- Memory snapshots
create table memory (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id),
  key text not null,
  value jsonb not null,
  updated_at timestamptz default now(),
  unique(cohort_id, key)
);
```

---

## Environment variables

```bash
# .env.local
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
PICOVOICE_ACCESS_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Build phases (flexible timing — Baz controls the calendar)

### Phase 1 — Voice loop
- [ ] Repo setup, Vercel deploy, Supabase project
- [ ] STT → Claude → TTS pipeline working end-to-end
- [ ] Latency under 2s
- [ ] First conversation in office

### Phase 2 — Admin + memory + visual
- [ ] Admin panel with pre-session approval flow
- [ ] Cohort + Track + Session models
- [ ] Mask SVG with amplitude-reactive animation
- [ ] Lip sync (Level 2 — viseme morphing)
- [ ] Memory tables + cross-session recall

### Phase 3 — Stage view + assets + wake word
- [ ] Asset library with tagging
- [ ] Visual command parser
- [ ] Stage view with fade transitions
- [ ] Picovoice "Hey Mask" wake word
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
2. **Voice latency is sacred.** Anything over 2s breaks the magic. Optimize relentlessly.
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

## Scope addition: AI alongside blockchain

Mask is not just a blockchain co-host. Curriculum will cover both AI and blockchain, framed as "modern earning skills." This means Mask's personality, story bank, and activities will expand to include AI topics — Claude Code, vibe coding, AI for content creation, building AI agents, etc.

Curriculum design happens separately (see Faceless EdTech strategy doc). Mask's prompt updates as curriculum grows.
