// lib/commandParser.ts
//
// Pure function that classifies a raw STT transcript into a stage command.
// No network, no React, no DB. Pure input → output.
//
// Vocabulary arrays are editable constants — add new phrases here as Baz
// discovers his natural speech patterns; each addition is a one-line edit.

export type StageCommand =
  | { command: "show"; query: string; explain: boolean }
  | { command: "explain" }
  | { command: "clear" }
  | { command: "none" };

// Longest-first within overlapping prefixes: "hey mask" before "mask" so
// the full prefix is consumed and "hey" is never left dangling in rest.
const ADDRESS_WORDS = ["hey mask", "ok mask", "mask"];

// Longest-first: "show them" before "show" so the full verb is stripped.
const SHOW_VERBS = ["pull up", "show them", "show", "display", "play", "let's see"];

const CLEAR_PHRASES = ["clear the stage", "clear that", "clear it", "close this"];

// Trailing explain clauses stripped from show queries (longest-first so longer
// phrases match before their substrings).
const EXPLAIN_TAILS = [
  ", tell them about it",
  " tell them about it",
  ", tell me about it",
  " tell me about it",
  ", tell them about",
  " tell them about",
  ", tell me about",
  " tell me about",
  " and explain this",
  " and explain that",
  " and explain it",
  " walk us through",
  " walk me through",
  " break it down",
  " what is this",
  " what's this",
  " and explain",
];

// Bare explain phrases — addressed, no show verb, self-referential (longest-first).
const BARE_EXPLAIN_PHRASES = [
  "tell me about this",
  "tell them about this",
  "walk us through this",
  "walk me through this",
  "tell me about that",
  "tell them about that",
  "explain this",
  "explain that",
  "explain it",
  "what is this",
  "what's this",
  "break it down",
  "explain",
];

export function parseCommand(transcript: string): StageCommand {
  // 1. Normalize: lowercase, trim, collapse internal whitespace.
  const s = transcript.toLowerCase().trim().replace(/[-–—]/g, " ").replace(/\s+/g, " ");

  // 2. ADDRESS GATE: transcript must open with an address word.
  //    Check longest-first (see ADDRESS_WORDS note above).
  //    Whisper may render a post-address pause as a period, comma, or other
  //    punctuation ("Mask. Pull up..." / "mask, pull up..."). Accept addr at
  //    the start if followed by end-of-string OR whitespace OR any single
  //    punctuation char (. , ! ; :), then strip addr + that punctuation +
  //    any following whitespace from rest.
  let rest = "";
  let addressed = false;
  for (const addr of ADDRESS_WORDS) {
    if (!s.startsWith(addr)) continue;
    const after = s.slice(addr.length);  // what follows the address word
    if (after === "" || /^[\s.,!;:]/.test(after)) {
      // Strip leading punctuation char (if any) + whitespace from rest.
      rest = after.replace(/^[.,!;:]\s*/, "").replace(/^\s+/, "");
      rest = rest.replace(/[.,!?;:]+$/, "").trim();
      addressed = true;
      break;
    }
  }

  // No address word at the start → not a stage command; let it flow to Claude.
  if (!addressed) return { command: "none" };

  // 3. rest = transcript with address word (and optional comma) removed.

  // 4. CLEAR CHECK: rest equals or starts with a clear phrase.
  for (const phrase of CLEAR_PHRASES) {
    if (
      rest === phrase ||
      rest.startsWith(phrase + " ") ||
      rest.startsWith(phrase + ",")
    ) {
      return { command: "clear" };
    }
  }

  // 5. SHOW CHECK: rest starts with a show verb (longest-first).
  for (const verb of SHOW_VERBS) {
    if (rest === verb || rest.startsWith(verb + " ")) {
      let query = rest.slice(verb.length).trim();

      // Light article strip: remove a single leading "the" or "a".
      // Not aggressive — we pass the rest to matchAssetByQuery and let
      // exact_phrases + fuzzy scoring handle the heavy lifting.
      query = query.replace(/^(the|a) /, "").trim();

      // Empty query (e.g. "mask pull up" with nothing after) → no-op.
      if (query.length === 0) return { command: "none" };

      // Detect and strip trailing explain clause (longest-first).
      let explain = false;
      for (const tail of EXPLAIN_TAILS) {
        if (query.endsWith(tail)) {
          query = query.slice(0, query.length - tail.length).trim();
          explain = true;
          break;
        }
      }

      // After stripping the explain tail, query could be empty.
      if (query.length === 0) return { command: "none" };

      return { command: "show", query, explain };
    }
  }

  // 6. BARE EXPLAIN CHECK: addressed, no show/clear verb, self-referential.
  for (const phrase of BARE_EXPLAIN_PHRASES) {
    if (rest === phrase || rest.startsWith(phrase + " ")) {
      return { command: "explain" };
    }
  }

  // 7. Addressed Mask but no show/clear/explain verb — flows to Claude.
  return { command: "none" };
}
