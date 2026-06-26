// Verifies parseCommand() in lib/commandParser.ts across 27 fixtures
// (show, clear, explain, negative, normalization, robustness branches).
// Run via: npm run verify:commands
// Exits 0 when all fixtures pass, 1 on any failure with per-fixture report.

import assert from "node:assert/strict";
import { parseCommand, type StageCommand } from "../lib/commandParser";

type CommandFixture = {
  name: string;
  input: string;
  expected: StageCommand;
};

const FIXTURES: CommandFixture[] = [
  // SHOW
  {
    name: "show — 'mask pull up the btc image'",
    input: "mask pull up the btc image",
    expected: { command: "show", query: "btc image", explain: false },
  },
  {
    name: "show — 'hey mask show them the pizza day' (long address + verb + article strip)",
    input: "hey mask show them the pizza day",
    expected: { command: "show", query: "pizza day", explain: false },
  },
  {
    name: "show — 'mask display evolution of web'",
    input: "mask display evolution of web",
    expected: { command: "show", query: "evolution of web", explain: false },
  },
  {
    name: "show (compound) — explain tail stripped from query, explain:true",
    input: "mask pull up the web123 evolution image and explain",
    expected: { command: "show", query: "web123 evolution image", explain: true },
  },
  // CLEAR
  {
    name: "clear — 'mask clear the stage'",
    input: "mask clear the stage",
    expected: { command: "clear" },
  },
  {
    name: "clear — 'hey mask close this'",
    input: "hey mask close this",
    expected: { command: "clear" },
  },
  {
    name: "clear — 'mask clear that'",
    input: "mask clear that",
    expected: { command: "clear" },
  },
  // NEGATIVES — anti-false-fire (most critical branch)
  {
    name: "none — addressed, question, no show/clear verb",
    input: "mask what is web 3",
    expected: { command: "none" },
  },
  {
    name: "none — show verb present but NO address word (must not fire)",
    input: "i was trying to pull up my notes earlier",
    expected: { command: "none" },
  },
  {
    name: "none — show verb at sentence start, NO address word",
    input: "pull up the btc image",
    expected: { command: "none" },
  },
  {
    name: "none — address only, no instruction",
    input: "mask",
    expected: { command: "none" },
  },
  {
    name: "none — address + verb but empty query after strip",
    input: "mask pull up",
    expected: { command: "none" },
  },
  // NORMALIZATION
  {
    name: "normalization — mixed case, extra spaces, leading comma after address",
    input: "  Mask,  Pull Up   the BTC Image  ",
    expected: { command: "show", query: "btc image", explain: false },
  },
  {
    name: "normalization — 'hey mask' address-only, longest address word, no instruction",
    input: "hey mask",
    expected: { command: "none" },
  },
  {
    name: "robustness — Whisper period after address ('mask. pull up the btc image')",
    input: "mask. pull up the btc image",
    expected: { command: "show", query: "btc image", explain: false },
  },
  {
    name: "none — word starting with 'mask' is not an address ('masking tape...')",
    input: "masking tape is useful for posters",
    expected: { command: "none" },
  },
  // HYPHEN NORMALIZATION
  {
    name: "show — 'mask pull-up evolution of web' (hyphenated verb)",
    input: "mask pull-up evolution of web",
    expected: { command: "show", query: "evolution of web", explain: false },
  },
  {
    name: "clear — 'mask close-this' (hyphenated clear)",
    input: "mask close-this",
    expected: { command: "clear" },
  },
  // TRAILING PUNCTUATION STRIP
  {
    name: "clear — 'Mask, clear the stage.' (cap + comma + period)",
    input: "Mask, clear the stage.",
    expected: { command: "clear" },
  },
  {
    name: "clear — 'Mask, close this.' (cap + comma + period)",
    input: "Mask, close this.",
    expected: { command: "clear" },
  },
  {
    name: "show — 'mask pull up evolution of web.' (trailing period guard)",
    input: "mask pull up evolution of web.",
    expected: { command: "show", query: "evolution of web", explain: false },
  },
  // EXPLAIN — compound show + bare explain
  {
    name: "show+explain (compound) — 'and explain it' tail stripped",
    input: "mask pull up evolution of web and explain it",
    expected: { command: "show", query: "evolution of web", explain: true },
  },
  {
    name: "show only — explain:false when no explain tail",
    input: "mask pull up evolution of web",
    expected: { command: "show", query: "evolution of web", explain: false },
  },
  {
    name: "explain (bare) — 'mask explain this'",
    input: "mask explain this",
    expected: { command: "explain" },
  },
  {
    name: "none (bare explain, no address) — 'explain this'",
    input: "explain this",
    expected: { command: "none" },
  },
  {
    name: "show+explain (compound) — ', tell me about it' tail stripped",
    input: "mask show evolution of web, tell me about it",
    expected: { command: "show", query: "evolution of web", explain: true },
  },
  {
    name: "clear (regression guard — show overhaul) — 'mask clear the stage'",
    input: "mask clear the stage",
    expected: { command: "clear" },
  },
];

let passed = 0;
let failed = 0;

function runFixture(f: CommandFixture, index: number): void {
  try {
    const result = parseCommand(f.input);
    assert.deepStrictEqual(
      result,
      f.expected,
      `expected ${JSON.stringify(f.expected)}, got ${JSON.stringify(result)}`,
    );
    passed++;
    console.log(`  ✅ [cmd ${index + 1}/${FIXTURES.length}] ${f.name}`);
  } catch (err) {
    failed++;
    console.error(`  ❌ [cmd ${index + 1}/${FIXTURES.length}] ${f.name}`);
    console.error(`     ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log("parseCommand fixtures:");
FIXTURES.forEach((f, i) => runFixture(f, i));

const total = passed + failed;
if (failed === 0) {
  console.log(`\n✅ ${passed}/${total} fixtures passed`);
  process.exit(0);
} else {
  console.error(`\n❌ ${passed}/${total} fixtures passed (${failed} failed)`);
  process.exit(1);
}
