# Mask Phase 2a — Visible Lip Sync

You are helping me build Mask, an AI voice co-host for my campus blockchain education sessions. I am Baz, founder of Faceless. Phase 1 (the voice loop: STT → Claude → TTS) shipped on April 30, 2026. This is Phase 2a — making Mask visible with animated lips that sync to the audio.

## Read the spec first

Before writing any code, read these files in order:

1. `README.md` — the source of truth for the build, including the locked stack, design decisions, and what's already shipped in Phase 1
2. `lib/personality.ts` — Mask's personality prompt (don't modify, just understand)
3. `docs/faceless-edtech-strategy.md` — company context (optional, useful for framing)

If anything in this prompt contradicts the README, ask me which is current. The README usually wins.

## What's already working (Phase 1 — don't break it)

- Push-to-talk button on `localhost:3000` records audio
- `app/api/stt/route.ts` sends audio to Whisper, returns transcript
- `app/api/chat/route.ts` sends transcript + personality prompt to Claude Sonnet 4.6 with prompt caching, returns response text
- `app/api/tts/route.ts` sends text to ElevenLabs Multilingual v2, returns audio
- `components/VoiceLoop.tsx` orchestrates the three calls
- `components/StatusIndicator.tsx` shows idle / listening / thinking / speaking states
- All keys in `.env.local`, gitignored

The voice loop currently lands at ~3 second round-trip. Latency is a known issue — DON'T touch it in this phase. Phase 2a is purely visual.

## Phase 2a scope — visible Mask with synced lips

We are building four things in sequence. Each ships green before the next starts. After each step, commit to git with a clear message and let me test it.

### Step 2a.1 — Mask renders on screen (replaces push-to-talk button)

Replace the current `app/page.tsx` UI with the actual Mask face. The mask is composed from these SVG files (all already in `public/`):

- `mask-base.svg` — solid mask shape (cream half + black half + collar + body), no holes
- `mask-eye-holes.svg` — two eye cutout shapes
- `mask-lips.svg` — six viseme cutout shapes inside `<g id="viseme-{name}">` groups (rest, closed, open-a, open-e, open-o, open-u)
- `mask-head.svg` — head-only crop of mask-base (for Phase 3, ignore for now)

The architecture uses SVG `<mask>` to punch holes through the solid base:

```jsx
<svg viewBox="0 0 400 400" className="...">
  <defs>
    <mask id="mask-cutouts">
      <rect width="400" height="400" fill="white"/>
      {/* eyes always punched */}
      <EyeHoles fill="black"/>
      {/* active viseme punched */}
      <ActiveViseme fill="black"/>
    </mask>
  </defs>
  <g mask="url(#mask-cutouts)">
    <MaskBase/>
  </g>
</svg>
```

Whatever's behind the mask (Starfield) shows through the holes.

**Build:**

1. Create `components/Starfield.tsx` — already drafted, copy from `public/Starfield.tsx` if it's there, otherwise I'll provide it. Renders animated multi-colored speckle stars on deep teal canvas at `#1a3a4a`. Uses `<canvas>` with `requestAnimationFrame`.

2. Create `components/Mask.tsx` — accepts a `viseme` prop with values `'rest' | 'closed' | 'open-a' | 'open-e' | 'open-o' | 'open-u'`. Default `'rest'`. Renders the SVG mask architecture above. The active viseme is determined by the prop. The component should inline the SVG content (use `dangerouslySetInnerHTML` for the SVG paths or import as React components — your call, just keep it clean).

3. Update `app/page.tsx`:
   - Full-screen layout, dark teal background
   - Starfield component as the background layer (`fixed inset-0 -z-10`)
   - Mask component centered, large (~60% viewport height)
   - Existing push-to-talk button moves to bottom of screen, smaller, less visually dominant
   - Status indicator stays visible somewhere (top-right corner is fine)

4. Hook up: when `VoiceLoop` is in the "speaking" state, briefly cycle through visemes for visual confirmation that the mask animates. Doesn't need to be synced yet — just rotate through `closed → open-a → open-e → open-o → rest` every 200ms. This is a placeholder we replace in Step 2a.3.

**Done when:** I open `localhost:3000` and see the actual Faceless mask face on a starfield background. When I press the talk button and Mask responds, the mouth visibly cycles through different shapes during speech (placeholder animation). When idle, Mask shows the rest smile.

Commit message: `Phase 2a.1: Mask renders on screen with placeholder mouth animation`

### Step 2a.2 — TTS endpoint returns timestamps

Modify `app/api/tts/route.ts` to call ElevenLabs' `/with-timestamps` endpoint instead of the standard endpoint. The response will include both `audio_base64` and an `alignment` object containing per-character timing data.

**Endpoint to use:** `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps`

**Response shape:**
```json
{
  "audio_base64": "...",
  "alignment": {
    "characters": ["H", "e", "l", "l", "o"],
    "character_start_times_seconds": [0.0, 0.046, 0.105, 0.150, 0.220],
    "character_end_times_seconds": [0.046, 0.105, 0.150, 0.220, 0.380]
  }
}
```

**Build:**

1. Update the API route to call the with-timestamps endpoint
2. Return both `audio` (the base64-decoded audio buffer or stream) AND `alignment` (the timing object) in the response. The exact response format depends on how `VoiceLoop.tsx` consumes it — design the cleanest interface.
3. Update `components/VoiceLoop.tsx` to handle the new response shape. Pass alignment data to a new `useLipSync` hook (we'll build the hook in 2a.3). For now, just `console.log` the alignment data when it arrives.

**Done when:** I press the talk button, speak to Mask, and see the alignment object logged in the browser console with characters and timestamps as Mask responds.

Commit message: `Phase 2a.2: TTS returns character-level timestamps`

### Step 2a.3 — Lip sync engine

Build the actual lip sync. When audio plays, the mouth swaps visemes based on the timing data.

**Phoneme mapping (simple character-based heuristic — Option A):**

Create `lib/visemeMapping.ts` with a function that converts a character to a viseme:

```typescript
export type Viseme = 'rest' | 'closed' | 'open-a' | 'open-e' | 'open-o' | 'open-u';

export function charToViseme(char: string): Viseme {
  const c = char.toLowerCase();
  if ('mbp'.includes(c)) return 'closed';
  if ('a'.includes(c)) return 'open-a';
  if ('ei'.includes(c)) return 'open-e';
  if ('o'.includes(c)) return 'open-o';
  if ('uw'.includes(c)) return 'open-u';
  return 'rest';
}
```

This is intentionally simple. We'll evaluate the visual quality after a real session and upgrade only if needed.

**Lip sync hook:**

Create `lib/useLipSync.ts`:

```typescript
export function useLipSync(audioRef: RefObject<HTMLAudioElement>, alignment: Alignment | null): Viseme {
  // Returns the current viseme based on audio playback time and alignment data
  // Uses requestAnimationFrame to update the viseme on each frame while audio plays
  // Defaults to 'rest' when not playing
}
```

The hook works like this:
1. Listens to the audio element's `timeupdate` events (or polls via `requestAnimationFrame` for smoother updates)
2. On each tick, gets the current `audio.currentTime`
3. Finds the character whose `character_start_times_seconds` < currentTime < `character_end_times_seconds`
4. Maps that character to a viseme via `charToViseme`
5. Returns the viseme

**Visemes snap, don't tween.** Don't add CSS transitions on the viseme swap — the snap is what makes it look like real lip sync at the speed humans speak. Tweening adds a perceived lag.

**Build:**

1. Create `lib/visemeMapping.ts` with the character lookup
2. Create `lib/useLipSync.ts` with the hook
3. Update `components/VoiceLoop.tsx`:
   - Replace the placeholder cycle from 2a.1 with `useLipSync`
   - Pass the resulting viseme into `<Mask viseme={currentViseme} />`
4. When audio ends, viseme should return to `'rest'`

**Done when:** I press the talk button, speak to Mask, and Mask's mouth shapes match the audio. "Hello" should look like the mouth opening on "e" and "o," briefly closing or near-closed on the "ll." It won't be perfect (especially on Tamil/Hindi), but it should clearly look like Mask is talking, not random twitching.

Commit message: `Phase 2a.3: Lip sync wired to TTS timestamps`

### Step 2a.4 — Subtitles

Render Mask's response as text below the mask, streaming in word by word as Claude generates.

**Source:** Subtitles come from the Claude streaming response (`app/api/chat/route.ts`), NOT from STT. STT captures Baz; we want what Mask is saying.

**Build:**

1. Create `components/Subtitles.tsx` — accepts a `text` prop, renders centered below the mask area
   - Large font (readable on a projector — 32-48px in dev, will tune in real sessions)
   - White text with subtle shadow for legibility on starfield
   - Max width ~80% of viewport, wraps gracefully
   - Fade in when text arrives, fade out 2 seconds after audio ends
   - Supports English, Tamil, Hindi (just needs a font that handles all three — system default likely works, but if rendering looks off use Google Fonts' Noto Sans family)

2. Update `components/VoiceLoop.tsx`:
   - Capture the streaming Claude response text as it arrives
   - Pass to `<Subtitles text={currentText} />`
   - Clear the subtitle text 2 seconds after the audio finishes playing

3. Update `app/page.tsx` layout to include Subtitles below the Mask component

**Done when:** I speak to Mask, see Mask's response appear as text below the mouth as it streams in, hear the audio play with synced lips, and watch the subtitles fade out a couple seconds after Mask stops talking.

Commit message: `Phase 2a.4: Subtitles render below Mask, fade with audio`

## Tech stack — locked, do not substitute

- Frontend: Next.js 14 (App Router) + Tailwind CSS + TypeScript (already set up from Phase 1)
- LLM: Claude Sonnet 4.6 (`claude-sonnet-4-6`) via Anthropic API — with prompt caching enabled
- STT: OpenAI Whisper (`whisper-1`) — DO NOT touch this in 2a
- TTS: ElevenLabs Multilingual v2 — but switching from the standard endpoint to with-timestamps in Step 2a.2
- Voice ID: Adam (`pNInz6obpgDQGcFmaJgB`) — placeholder, will swap in Phase 2b after voice audition
- Hosting: Vercel (still local dev only)

Do not suggest alternatives. The stack is chosen.

## Critical priorities

1. **Each step ships independently.** Don't get ahead. Don't combine steps. Commit between them.

2. **Don't break Phase 1.** The push-to-talk → STT → Claude → TTS pipeline must keep working at every step.

3. **Personality is everything.** The system prompt in `lib/personality.ts` stays untouched. Pass it as the system message in every Claude API call exactly as before.

4. **SVG architecture is the right approach.** Don't replace it with raster images, image elements, or CSS animations. The mask uses inline SVG with `<mask>` for cutouts. This is how it scales for any screen size and how the visemes swap cleanly.

5. **Visemes snap, don't tween.** No CSS transitions on the viseme change. The snap is correct.

## How we work

- Walk me through your plan for the current step before writing code. I want to approve the approach.
- Build incrementally within a step. Get one piece working, commit, move to the next.
- After each step ships, stop and let me test before moving to the next step.
- If the README is missing something we need, flag it and we update the README first.
- If you hit a decision that's not specified here, ask me. Do not assume.

## Success criteria for Phase 2a

End of Phase 2a, I should be able to:

1. Run `npm run dev`
2. Open `localhost:3000`
3. See Mask's face on a starfield background (idle smile)
4. Press and hold the talk button
5. Say "Hey Mask, what's blockchain?"
6. Watch the mask's mouth animate in sync with the audio response
7. Read the subtitles streaming below as Mask speaks
8. See Mask return to the rest smile when done speaking

That's Phase 2a done. Ship clip: "Mask now has lips."

Let's start with Step 2a.1. Walk me through your plan before writing code.
