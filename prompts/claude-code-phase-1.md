# Mask Phase 1 — Voice Loop

You are helping me build Mask, an AI voice co-host for my campus blockchain education sessions in Coimbatore, India. I am Baz, founder of Faceless.

## Read the spec first

Before writing any code, read these three files in order:

1. `README.md` — the complete build spec, tech stack, architecture, and locked design decisions
2. `lib/personality.ts` — Mask's full personality prompt
3. `docs/faceless-edtech-strategy.md` — company-level context (optional but useful for understanding why we're building this)

The README is the source of truth. Reference it for any decision. If something in our conversation contradicts the README, ask me which one is current.

## Phase 1 scope — voice loop only

We are NOT building everything tonight. Phase 1 is the voice loop end-to-end. Nothing else.

The goal: I should be able to open the app on my laptop, click a button, speak into my mic, and have Mask respond out loud in under 2 seconds. That is the entire Phase 1 deliverable.

Specifically, build:

1. Next.js 14 project initialized with Tailwind, TypeScript, App Router
2. Supabase client set up with environment variables (don't create the schema yet, just the connection)
3. A single page at `app/page.tsx` with one big push-to-talk button
4. API route `app/api/stt/route.ts` that streams audio to Deepgram Nova-2 and returns the transcript
5. API route `app/api/chat/route.ts` that sends the transcript + the personality system prompt to Claude Sonnet 4.6 and streams the response back
6. API route `app/api/tts/route.ts` that streams the Claude response to ElevenLabs Turbo v2.5 and returns audio
7. A basic `components/VoiceLoop.tsx` that orchestrates the three API calls
8. A simple status indicator showing "listening" / "thinking" / "speaking"

What we are NOT building in Phase 1:
- The animated mask SVG (Phase 2)
- Wake word detection (Phase 3)
- The stage view, asset library, or visual commands (Phase 3)
- The admin panel or session briefs (Phase 2)
- Memory or transcripts (Phase 2)
- Subtitles (Phase 2)
- The cohort/track/session models (Phase 2)

Stay disciplined. Phase 1 is the voice loop only.

## Tech stack — locked, do not substitute

- Frontend: Next.js 14 (App Router) + Tailwind CSS + TypeScript
- LLM: Claude Sonnet 4.6 via the Anthropic API (`claude-sonnet-4-6`)
- STT: Deepgram Nova-2 (streaming)
- TTS: ElevenLabs Turbo v2.5 (streaming)
- Database: Supabase (just the client setup for now)
- Hosting: Vercel

Do not suggest alternatives. The stack is chosen.

## Environment variables I'll provide

Help me set up `.env.local` with these placeholders. I will fill in the actual values.

```
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

I do not have a Picovoice key yet (that's for Phase 3). Skip wake word entirely for now.

## Critical priorities

1. **Latency budget: under 2 seconds total** from end-of-speech to start-of-Mask-speaking. Streaming is mandatory at every layer — Deepgram streaming STT, Claude streaming response, ElevenLabs streaming TTS. Do not buffer entire responses.

2. **Personality is everything.** Mask is not a chatbot. The system prompt in `lib/personality.ts` is the brain. Pass it as the system message in every Claude API call — do not summarize it, do not modify it, do not "improve" it.

3. **Push-to-talk for now.** Wake word comes in Phase 3. For Phase 1, a single big button in the center of the page that I hold down to talk. Release to send.

## How we work

- Walk me through your plan before writing code. I want to approve the approach.
- Build incrementally. Get the project initialized first, then one API route at a time, then wire them together.
- After each working piece, commit to git with a clean message.
- If you hit a decision that's not specified in the README, ask me. Do not assume.
- If the README is missing something we need, flag it and we'll update the README.

## Success criteria for Phase 1

I should be able to:
1. Run `npm run dev`
2. Open `localhost:3000`
3. Click and hold a button
4. Say "Hey Mask, what's blockchain?"
5. Hear Mask respond in voice within 2 seconds, in Mask's actual personality (multilingual, conversational, with the energy described in `personality.ts`)
6. See status indicators showing what's happening

That's it. Phase 1 done.

Let's start. Walk me through your plan first.
