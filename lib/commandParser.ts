// lib/commandParser.ts
//
// Pure function that classifies a raw STT transcript into a stage command.
// No network, no React, no DB. Pure input → output.
//
// Vocabulary arrays are editable constants — add new phrases here as Baz
// discovers his natural speech patterns; each addition is a one-line edit.

export type StageCommand =
  | { command: "show"; query: string }
  | { command: "clear" }
  | { command: "none" };

// Longest-first within overlapping prefixes: "hey mask" before "mask" so
// the full prefix is consumed and "hey" is never left dangling in rest.
const ADDRESS_WORDS = ["hey mask", "ok mask", "mask"];

// Longest-first: "show them" before "show" so the full verb is stripped.
const SHOW_VERBS = ["pull up", "show them", "show", "display", "play", "let's see"];

const CLEAR_PHRASES = ["clear the stage", "clear that", "clear it", "close this"];

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

      return { command: "show", query };
    }
  }

  // 6. Addressed Mask but no show/clear verb — e.g. "mask what's web3".
  //    Not a stage command; flows to Claude as normal speech.
  return { command: "none" };
}
