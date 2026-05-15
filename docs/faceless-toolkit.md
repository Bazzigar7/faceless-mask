# Faceless Toolkit — Captured Needs

> A running list of student-facing tool ideas that come up during sessions. Do NOT build any of this yet. Mask V1 ships first. This doc exists so good ideas don't get lost while we stay disciplined on scope.

---

## Rules for this doc

1. Capture, don't act. Every idea goes in raw.
2. Source matters — note where the idea came from (a session, a student question, a brand request, your own observation).
3. Frequency matters — if the same need shows up 5+ times across different sessions, it graduates to a real candidate.
4. We revisit this doc only after Mask Phase 5 ships.

---

## Captured needs

*(empty — start logging from first session onwards)*

### Template for entries

```
- **Need**: [one line description]
- **Source**: [session date / who said it / context]
- **Frequency**: [1st time, 3rd time, etc.]
- **Notes**: [anything else worth remembering]
```

---

## Mask polish backlog

> Observations from building Mask that aren't bugs but would improve the experience. Same rule as captured needs above: capture, don't act. Revisit after Phase 5 ships, or sooner if the same observation recurs.

- **Need**: Reduce viseme ping-ponging during running speech
- **Source**: 2026-05-08, own observation during 2a.3 lip sync first dev test
- **Frequency**: 1st observation
- **Notes**: Real speech has ~7-12 viseme transitions/sec, which is correct behavior — partly a perceptual recalibration after the 200ms placeholder cycle. Amplified because every unmapped consonant falls through to 'rest', causing ping-pong between mouth-shapes and rest. Possible polish: map more consonants to a neutral-open viseme to soften the ping-pong. Defer — heuristic is intentionally simple per 2a.3 spec; revisit after a real classroom session.

- **Need**: Tweak mask-base.svg toward a more neutral resting expression
- **Source**: 2026-05-08, own observation during 2a.3 lip sync first dev test
- **Frequency**: 1st observation
- **Notes**: Current Mask asset has a permanent smile that fights with lip movement visually. Asset design constraint, not a sync issue. Defer — likely revisit when Mask asset audition + final voice are locked.

- **Need**: Strip markdown emphasis from voice/subtitle output
- **Source**: 2026-05-08, own observation during 2a.5.3 wordCount verification
- **Frequency**: 1st observation
- **Notes**: Mask outputs markdown emphasis (e.g., *word*) in responses, which renders as literal asterisks in subtitles. Three resolution options: (a) strip markdown before render, (b) render as bold, (c) update personality.ts to avoid markdown for voice output. Lean: personality update — markdown belongs in chat, not voice. Defer until karaoke subtitles ship and we see how often this trips up real sessions.

- **Need**: Remove hidden debug block from VoiceLoop.tsx
- **Source**: 2026-05-08, surfaced during 2a.5.3 reply-chain audit
- **Frequency**: 1st observation
- **Notes**: `<div className="hidden">` wrapper at VoiceLoop's bottom (lines ~344+) has been `display: none` since 2a.B.2 with no toggle to reveal. After 2a.5.6 reply-chain cleanup it now contains only transcript and error sub-blocks. Either the entire block is dead UI to delete (and free the transcript/error state vars if they end up orphaned) or a toggle to reveal it should ship. Lean: delete. Defer to a dedicated cleanup phase to keep diffs single-concern.

- **Need**: Extract findActiveSentence helper shared by useLipSync and useCurrentWord
- **Source**: 2026-05-08, observed during 2a.5.2 useCurrentWord plan
- **Frequency**: 1st observation
- **Notes**: `useLipSync` (lib/useLipSync.ts:23–37) and `useCurrentWord` (lib/useCurrentWord.ts:48–58) both walk `alignmentStoreRef` looking for the entry whose `[audioStartTime, audioStartTime + duration)` interval contains `audio.currentTime`. Identical logic, copy-pasted across two files. Pure function extraction (`lib/findActiveSentence.ts` taking store + t, returning entry-or-null) would dedupe cleanly. Both hooks would call it then do their respective inner work (`charToViseme` vs word lookup). Defer to a dedicated cleanup phase.

- **Need**: Subtitle karaoke timing drifts ahead of audio — current-word highlight runs faster than what Mask actually speaks. Visible on longer Mask responses.
- **Source**: 2026-05-11 smoke test for 2b.5.1.0 — Mt. Gox story turn against session 0...0004
- **Frequency**: 1st explicit capture (may have existed since 2a.5 ship, just unnoticed on shorter test turns)
- **Notes**: Surface is useCurrentWord.ts + wordSegments.ts + ElevenLabs alignment data. Possible causes: word-segment boundaries calculated from char-level alignment in a way that drifts on longer sentences; or audio.currentTime polled via requestAnimationFrame stalls behind playback. Investigate when next pass on subtitle code. Pairs with the findActiveSentence helper extraction already in the backlog.

- **Need**: Mask responses sometimes run too long for live classroom cadence. The energy drains, students disengage, and Mask undermines its own "energy co-host" role. Classroom needs short conversational beats, not paragraph-length monologues.
- **Source**: 2026-05-15, own observation during Phase 3.1.2.2 / Tier 1.1 smoke (markdown suppression). 5/5 prompts returned clean markdown but several responses ran long enough to feel draggy in live-classroom imagination.
- **Frequency**: 1st explicit observation, but two existing rules in personality.ts already nod at this concern as soft nudges that aren't fully firing — "Short sentences. You're on a speaker, not a textbox." (Voice and rhythm) and "Never lecture more than 90 seconds without engaging the room" (Hard rule #6 post-3.1.2.2 renumbering).
- **Notes**: Lean fix: sharper rule with response-category length budgets (greeting / quick answer / explanation / story), generation-time tightening over post-processing truncation (truncation cuts audio mid-sentence). Needs its own smoke methodology — "did the response feel too long" is observational, not character-detectable like markdown. Personality-drift risk if rule is too aggressive (Mask becoming clipped/robotic instead of energetic-conversational); calibration matters. Defer to Tier 1.4 or its own Phase 3.1.2.X — not in scope for Tier 1.1 / 1.2 / 1.3.

---

## Categories to watch for

These are the buckets we expect ideas to fall into. Not exhaustive — add new ones as they emerge.

- **Content creation** — scripts, hooks, captions, thumbnails, video edits
- **Campaign work** — brand brief understanding, deliverable tracking, performance review
- **Learning aids** — quiz me, summarize last session, explain again, exam prep
- **Personal coaching** — pep talks, accountability, goal tracking
- **Community / social** — DMs, comments, replies, networking
- **On-chain stuff** — wallet help, transaction explanations, scam checks

---

## Decision rule for graduating an idea

An idea moves from this doc into product planning when:

1. It's been requested by 5+ students across 3+ different sessions, OR
2. A brand partner explicitly asks for it as part of a campaign, OR
3. Baz keeps thinking about it for 2+ weeks (real signal)

Until then it sits here. That's the discipline.
