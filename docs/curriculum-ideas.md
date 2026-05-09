# Curriculum Ideas — Captured Topics

> A running list of teaching topics, beginner concepts, and session ideas that come up during real building, sessions, or student questions. Do NOT design full curriculum from this yet. This doc exists so good ideas don't get lost between now and the dedicated curriculum-design session.

---

## Rules for this doc

1. Capture, don't design. Every idea goes in raw, even if half-formed.
2. Source matters — note where the idea came from (a build moment, a student question, a session, your own observation).
3. Frequency matters — if the same concept trips up multiple students or shows up across multiple contexts, it's a strong candidate for a real session.
4. We revisit this doc on curriculum-design day (separate session, see strategy doc).

---

## Captured topics

### 1. API keys — what they are, how they work, why they matter

- **Source**: April 30, 2026 — Baz setting up Mask Phase 1, hit "wait, what are these keys, why two different billing systems, why is one used and one not, am I going to break something if I delete it"
- **Frequency**: 1st time (but this will hit *every* student who tries to vibe-code anything)
- **Notes**:
  - This is the exact moment beginners fall off when trying to build with AI tools
  - Concepts a session should cover:
    - What an API key actually is (a password for a service, scoped to your account)
    - Why services hand them out (so they can bill you, rate-limit you, and revoke access if abused)
    - The difference between "chat subscription" billing and "API usage" billing — same company, different wallets (Claude.ai Pro vs Anthropic Console)
    - Why API keys are shown only once (security — never stored in cleartext on the server side)
    - Where to store them (`.env.local`, never in code, never committed to git)
    - What happens when you leak one (someone runs up your bill, you rotate the key)
    - How to set spend limits as a safety net
  - Hands-on element: each student gets their own Anthropic key, Deepgram key, etc., and learns to wire them into a starter repo
  - This naturally pairs with the "Vibe Coding" track in the strategy doc (Track 5)

---

### Template for new entries

```
### [Number]. [Topic title]

- **Source**: [date / context / who raised it]
- **Frequency**: [1st time, 3rd time across N students, etc.]
- **Notes**:
  - [What the concept is]
  - [Why it trips students up]
  - [Sub-topics a session should cover]
  - [Hands-on element if any]
  - [Which track it likely belongs in]
```

---

## Categories to watch for

These are the buckets we expect topics to fall into. Maps loosely to the 12-track draft in the strategy doc.

- **Foundations** — what is the internet, what is an account, what is a wallet, what is an API
- **AI literacy** — prompts, tokens, context windows, hallucination, what AI can and can't do
- **Vibe coding** — Claude Code basics, env files, git, deployment, debugging
- **Web3 essentials** — wallets, gas, transactions, scams, on-chain reading
- **Creator skills** — hooks, scripts, captions, thumbnails, posting cadence
- **Earning skills** — how brand deals work, deliverables, invoicing, taxes (lightweight)

---

## Decision rule for graduating a topic

A captured topic becomes a real session when:

1. It's been mentioned/needed by 5+ students across 3+ sessions, OR
2. It's a clear prerequisite for something we're already teaching (e.g. "you can't teach vibe coding without first teaching API keys"), OR
3. It comes up repeatedly while building Faceless products (real signal that students will hit the same wall)

Until then it sits here.
