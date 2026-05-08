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
