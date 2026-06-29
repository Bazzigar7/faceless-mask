# CLAUDE.md — Mask Faceless CoHost session memory

Claude Code reads this at the start of each session. Update at session close. This is the single-session-state truth; the README is the canonical product truth.

---

## Current HEAD

**fb9e8e9 / 153 / clean / in sync with origin/master** (2026-06-30)

---

## What shipped tonight (2026-06-29–30)

### Grounded-explanation slice — COMPLETE (all 3 commits ears-proven)

| Commit | What |
|---|---|
| `7931427` | `parseCommand` explain signal — `StageCommand` gains `explain: boolean` on show variant + bare `{ command: "explain" }` type; `EXPLAIN_TAILS` + `BARE_EXPLAIN_PHRASES`; verify:commands 21→27 fixtures |
| `68ee4ec` | VoiceLoop 6-way intercept branch — silent early-return for `show + video + !explain`; `SHOW_ACKS`/`CLEAR_ACKS` canned-ack rotations; `stagedAssetRef` tracks staged asset for bare-explain lookup. **Silent-video EARS-PROVEN 2026-06-27** (cold-restart + fresh tab) |
| `ec80b83` | Grounded-explanation 2b — staged asset `description` folded into the user-turn on explain paths (`[On screen: ...]` prefix); bare-explain uses `stagedAssetRef.current.description`; free-form stays ungrounded by design; Mask riffs not recites |

### Video audio + controls

| Commit | What |
|---|---|
| `4d2526a` | Stage video unmuted + `playsInline` — removed hardcoded `muted` from Stage.tsx; autoplay works post-arm via page engagement; no prewarm needed; ears-proven on both push-to-talk and wake-word paths |
| `fb9e8e9` | Video Pause/Resume control + stop looping — `loop` dropped (plays once, parks on last frame); `onEnded → setPaused(true)`; Pause/Resume button in page.tsx (video-only, `fixed bottom-6 left-8 z-20`); `paused` state owned by page.tsx, threaded through StageLayout → Stage via prop; resets on new asset id. VoiceLoop bottom-cluster pointer-events fix: `pointer-events-none` on full-width container, `pointer-events-auto` on interactive children (Hold-to-speak button + WakeWord wrapper) — was intercepting clicks on Pause button (confirmed via `elementFromPoint`) |

---

## What's pending (recommended order)

1. **Neuter `<stage>` in personality.ts** — parser is sole stage owner; `parseStageTags` already strips leaked tags from TTS/subtitles as a safety net. Downgraded to pure cleanup, low urgency. Scope: personality.ts edit + re-snapshot (verify:prompt bytes change).

2. **/api/assets fetch-cache fix** — Next.js caches the `/api/assets` route response; an asset uploaded after server start is invisible until cache clears. Fix: add `export const revalidate = 0` (or `force-dynamic`) to `app/api/assets/route.ts`. Audit first — confirm the route doesn't already have a cache directive.

3. **Hardware gate** — DJI Mic + R400 clicker not yet arrived. When they do:
   - R400 "B" button → `togglePaused` keydown binding (the handler is already named for this)
   - DJI Mic → confirm hot-mic path, silence detector tuning

4. **Vocabulary-robustness slice** — wrong-script Whisper transcription of code-mix speech, misheard words, rephrasing outside fixed verb/phrase lists. Operational until this lands: tag assets generously with `exact_phrases`.

5. **Interrupt/clicker slice** — Pause is its on-screen half; R400 clicker hardware trigger is the other half.

6. **Admin EDIT** — asset edit form (description, exact_phrases, tags) — currently upload + delete only.

7. **Autoplay timing** — if a video autoplays before page engagement, browser may block unmuted autoplay. Current workaround: wake-word arm counts as engagement. Monitor in classroom (projector/TV cold-start).

8. **Streaming STT** — Whisper is batch; full utterance latency before Claude starts. Streaming STT (Deepgram or Whisper streaming) is the remaining path to <2s round-trip.

9. **Wake word V2** — cross-browser / on-device engine (Vosk or Porcupine if terms change). V1 is Chrome-only Web Speech API.

---

## Lessons banked

**Stale assetsRef + Next fetch-cache** — VoiceLoop fetches `/api/assets` once on mount; if a video row is added to the DB after dev-server start, it is invisible in assetsRef until cold restart. Additionally, Next.js fetch-cache can return a stale snapshot even after restart. The only guaranteed fresh-state sequence: `lsof -ti:3000 | xargs kill -9`, `rm -rf .next`, `npm run dev`, then open a **fresh tab** (not reload) after any asset insertion.

**Fabricated-cause discipline** — the missing-video-row bug was initially mis-diagnosed as a phantom RLS policy. The correct root cause (Next.js fetch-cache staleness) fit all evidence (service-role returned 2 rows, API returned 1). Always: simplest cause fitting ALL evidence wins. Use uncommitted console probes to distinguish candidate causes before editing load-bearing code.

**Overlay-click interception** — a `fixed inset-x-0` full-width bar with no handlers eats pointer events on its transparent area. Confirmed via `elementFromPoint`. Fix pattern: `pointer-events-none` on the layout container, `pointer-events-auto` on interactive children only.

**play/pause race** — `v.play()` returns a Promise; calling `v.pause()` before it resolves can be overridden when the Promise resolves. In Stage.tsx the effect calls `v.play().catch(() => {})` which swallows the abort — investigate if a pause-then-play transition ever fails to play. Race was not the primary blocker (overlay interception was confirmed first), but keep in mind if pause/resume misbehaves after the pointer-events fix.

---

## Verify suite baselines (as of 153)

| Suite | Expectation |
|---|---|
| `npm run build` | exit 0 |
| `npm run verify:prompt` | 23,433 bytes / 352 lines |
| `npm run verify:visual` | 32/32 fixtures |
| `npm run verify:commands` | 27 fixtures |
