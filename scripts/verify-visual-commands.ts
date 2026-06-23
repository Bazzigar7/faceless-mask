// Verifies the two pure functions in lib/visualCommands.ts behave
// correctly across 28 fixtures (18 parseStageTags + 10 matchAssetByQuery).
// Each parseStageTags fixture asserts the return shape AND whether
// console.warn fired for malformed inputs. SEED_ASSETS mirrors the
// 5 rows seeded in migration 20260516030000_assets_tighten_and_seed.sql.
//
// Run via: npm run verify:visual
// Exits 0 when all fixtures pass, 1 on any failure with per-fixture report.

import assert from "node:assert/strict";
import { parseStageTags, matchAssetByQuery } from "../lib/visualCommands";
import type { Asset, StageEvent } from "../lib/types";

// --- console.warn capture ---------------------------------------------------
// Override console.warn so fixtures can assert when parseStageTags emits
// warnings for malformed input. No restore — this process exits at the end.

const capturedWarns: unknown[][] = [];
console.warn = (...args: unknown[]) => {
  capturedWarns.push(args);
};

function getWarnings(): unknown[][] {
  return capturedWarns;
}

function clearWarnings(): void {
  capturedWarns.length = 0;
}

// --- Seed assets ------------------------------------------------------------
// Mirrors supabase/migrations/20260516030000_assets_tighten_and_seed.sql.
// id, url, and created_at are fixture filler (they don't affect matching);
// type, tags, alt_text match the migration row-for-row.

const SEED_ASSETS: Asset[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    type: "image",
    url: "https://example.com/btc.png",
    storage_path: null,
    tags: ["bitcoin", "btc", "logo"],
    exact_phrases: [],
    alt_text: "Bitcoin logo placeholder",
    description: null,
    added_by: "baz",
    created_at: "2026-05-17T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    type: "image",
    url: "https://example.com/eth.png",
    storage_path: null,
    tags: ["ethereum", "eth", "logo"],
    exact_phrases: [],
    alt_text: "Ethereum logo placeholder",
    description: null,
    added_by: "baz",
    created_at: "2026-05-17T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    type: "image",
    url: "https://example.com/pizza.jpg",
    storage_path: null,
    tags: ["pizza", "pizza-day", "laszlo", "bitcoin-pizza"],
    exact_phrases: ["pizza day", "the pizza story"],
    alt_text: "Pizza day placeholder image",
    description: null,
    added_by: "baz",
    created_at: "2026-05-17T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    type: "image",
    url: "https://example.com/sol.png",
    storage_path: null,
    tags: ["solana", "sol", "logo"],
    exact_phrases: [],
    alt_text: "Solana logo placeholder",
    description: null,
    added_by: "baz",
    created_at: "2026-05-17T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    type: "video",
    url: "https://example.com/bunny.mp4",
    storage_path: null,
    tags: ["test", "video", "placeholder"],
    exact_phrases: [],
    alt_text: "Big Buck Bunny test video",
    description: null,
    added_by: "baz",
    created_at: "2026-05-17T00:00:00Z",
  },
];

// Two-asset slice used by the EXACT-BEATS-FUZZY fixture.
// -010 has tags ["pizza","day"] and no exact phrases — it would score 2
// on "pizza day" and WIN Tier 2.  -003 has exact_phrases:["pizza day"] but
// empty tags — it would score 0 and LOSE Tier 2.  Tier 1 must return -003.
const EXACT_BEATS_FUZZY_ASSETS: Asset[] = [
  {
    id: "00000000-0000-0000-0000-000000000010",
    type: "image",
    url: "https://example.com/fuzzy.png",
    storage_path: null,
    tags: ["pizza", "day"],
    exact_phrases: [],
    alt_text: null,
    description: null,
    added_by: "baz",
    created_at: "2026-05-17T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    type: "image",
    url: "https://example.com/pizza.jpg",
    storage_path: null,
    tags: [],
    exact_phrases: ["pizza day"],
    alt_text: null,
    description: null,
    added_by: "baz",
    created_at: "2026-05-17T00:00:00Z",
  },
];

// --- parseStageTags fixtures ------------------------------------------------

type ParseFixture = {
  name: string;
  input: string;
  expectedStripped: string;
  expectedEvents: StageEvent[];
  expectsWarn: boolean;
};

const PARSE_FIXTURES: ParseFixture[] = [
  {
    name: "happy path — show tag mid-sentence",
    input: `Today we eat <stage>{"action":"show","query":"pizza day bitcoin"}</stage> pizza.`,
    expectedStripped: "Today we eat  pizza.",
    expectedEvents: [{ action: "show", query: "pizza day bitcoin" }],
    expectsWarn: false,
  },
  {
    name: "plain text — no tags",
    input: "Just talking about Bitcoin's whitepaper today.",
    expectedStripped: "Just talking about Bitcoin's whitepaper today.",
    expectedEvents: [],
    expectsWarn: false,
  },
  {
    name: "empty string",
    input: "",
    expectedStripped: "",
    expectedEvents: [],
    expectsWarn: false,
  },
  {
    name: "two show tags in source order",
    input: `First <stage>{"action":"show","query":"bitcoin"}</stage> then <stage>{"action":"show","query":"ethereum"}</stage> end.`,
    expectedStripped: "First  then  end.",
    expectedEvents: [
      { action: "show", query: "bitcoin" },
      { action: "show", query: "ethereum" },
    ],
    expectsWarn: false,
  },
  {
    name: "hide tag — no query field",
    input: `Done with that <stage>{"action":"hide"}</stage> moving on.`,
    expectedStripped: "Done with that  moving on.",
    expectedEvents: [{ action: "hide" }],
    expectsWarn: false,
  },
  {
    name: "malformed JSON body — stripped, no event, warns",
    input: `Watch this <stage>{not valid json}</stage> happen.`,
    expectedStripped: "Watch this  happen.",
    expectedEvents: [],
    expectsWarn: true,
  },
  {
    name: "show with empty-string query — stripped, no event, warns",
    input: `Try this <stage>{"action":"show","query":""}</stage> moment.`,
    expectedStripped: "Try this  moment.",
    expectedEvents: [],
    expectsWarn: true,
  },
  {
    name: "show with no query field — stripped, no event, warns",
    input: `Try this <stage>{"action":"show"}</stage> moment.`,
    expectedStripped: "Try this  moment.",
    expectedEvents: [],
    expectsWarn: true,
  },
  {
    name: "unknown action verb — stripped, no event, warns",
    input: `Try this <stage>{"action":"launch","query":"rocket"}</stage> moment.`,
    expectedStripped: "Try this  moment.",
    expectedEvents: [],
    expectsWarn: true,
  },
  {
    name: "array body — JSON.parse succeeds but Array.isArray rejects, stripped + warns",
    input: `Try this <stage>[1,2]</stage> moment.`,
    expectedStripped: `Try this  moment.`,
    expectedEvents: [],
    expectsWarn: true,
  },
  {
    name: "padded wrapper — whitespace between <stage> and { tolerated",
    input: `Try this <stage> {"action":"show","query":"pizza"} </stage> moment.`,
    expectedStripped: `Try this  moment.`,
    expectedEvents: [{ action: "show", query: "pizza" }],
    expectsWarn: false,
  },
  {
    name: "uppercase tag — <STAGE>...</STAGE> tolerated",
    input: `Try this <STAGE>{"action":"show","query":"pizza"}</STAGE> moment.`,
    expectedStripped: `Try this  moment.`,
    expectedEvents: [{ action: "show", query: "pizza" }],
    expectsWarn: false,
  },
  {
    name: "mixed-case tag — <Stage>...</Stage> tolerated",
    input: `Try this <Stage>{"action":"show","query":"pizza"}</Stage> moment.`,
    expectedStripped: `Try this  moment.`,
    expectedEvents: [{ action: "show", query: "pizza" }],
    expectsWarn: false,
  },
  {
    name: "braces-less body — strips, JSON.parse fails, warns",
    input: `Try this <stage>show pizza</stage> moment.`,
    expectedStripped: `Try this  moment.`,
    expectedEvents: [],
    expectsWarn: true,
  },
  {
    name: "empty body — strips, JSON.parse fails, warns",
    input: `Try this <stage></stage> moment.`,
    expectedStripped: `Try this  moment.`,
    expectedEvents: [],
    expectsWarn: true,
  },
  {
    name: "newline padding inside tag tolerated",
    input: `Try this <stage>\n{"action":"show","query":"pizza"}\n</stage> moment.`,
    expectedStripped: `Try this  moment.`,
    expectedEvents: [{ action: "show", query: "pizza" }],
    expectsWarn: false,
  },
  {
    name: "unterminated opener — no closing tag, text passes verbatim",
    input: `He moved to the next <stage> of the project, focusing on growth.`,
    expectedStripped: `He moved to the next <stage> of the project, focusing on growth.`,
    expectedEvents: [],
    expectsWarn: false,
  },
  {
    name: "non-greedy span match — opener+closer with prose between, span stripped, warns",
    input: `Hello <stage>this is regular prose that mentions a stage and continues</stage> world.`,
    expectedStripped: `Hello  world.`,
    expectedEvents: [],
    expectsWarn: true,
  },
];

// --- matchAssetByQuery fixtures ---------------------------------------------

type MatchFixture = {
  name: string;
  query: string;
  assets: Asset[];
  expectedId: string | null;
};

const MATCH_FIXTURES: MatchFixture[] = [
  {
    name: "happy path — pizza day bitcoin → -003",
    query: "pizza day bitcoin",
    assets: SEED_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000003",
  },
  {
    name: "unique-tag single match — laszlo → -003",
    query: "laszlo",
    assets: SEED_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000003",
  },
  {
    name: "tie on logo — first-in-order wins (-001)",
    query: "logo",
    assets: SEED_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000001",
  },
  {
    name: "empty query — null",
    query: "",
    assets: SEED_ASSETS,
    expectedId: null,
  },
  {
    name: "whitespace-only query — null",
    query: "   ",
    assets: SEED_ASSETS,
    expectedId: null,
  },
  {
    name: "no overlap — null",
    query: "spacecraft",
    assets: SEED_ASSETS,
    expectedId: null,
  },
  {
    name: "empty asset list — null",
    query: "anything",
    assets: [],
    expectedId: null,
  },
  {
    name: "tie on bitcoin — -001 wins over -003",
    query: "bitcoin",
    assets: SEED_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000001",
  },
  {
    name: "hyphen split — 'day' matches pizza-day subtoken",
    query: "day",
    assets: SEED_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000003",
  },
  {
    name: "case insensitive — PIZZA Day BITCOIN → -003",
    query: "PIZZA Day BITCOIN",
    assets: SEED_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000003",
  },
  // --- Tier 1 exact_phrases fixtures ---
  {
    name: "exact hit — 'pizza day' matches pizza via exact_phrases (Tier 1)",
    query: "pizza day",
    assets: SEED_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000003",
  },
  {
    name: "exact normalization — '  Pizza  Day  ' matches pizza via normalized exact_phrases",
    query: "  Pizza  Day  ",
    assets: SEED_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000003",
  },
  {
    // -010 has tags ["pizza","day"] and scores 2 on "pizza day" — it would win Tier 2.
    // -003 has exact_phrases:["pizza day"] and empty tags — it scores 0 on Tier 2.
    // Tier 1 must return -003 despite -010 being the fuzzy winner.
    name: "exact beats fuzzy — exact_phrases winner overrides higher-scoring fuzzy asset",
    query: "pizza day",
    assets: EXACT_BEATS_FUZZY_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000003",
  },
  {
    name: "no exact match falls through to fuzzy — 'laszlo' hits pizza via Tier 2 tags",
    query: "laszlo",
    assets: SEED_ASSETS,
    expectedId: "00000000-0000-0000-0000-000000000003",
  },
];

// --- Runner -----------------------------------------------------------------

let passed = 0;
let failed = 0;

function runParseFixture(f: ParseFixture, index: number): void {
  clearWarnings();
  try {
    const result = parseStageTags(f.input);
    assert.deepStrictEqual(
      result.strippedText,
      f.expectedStripped,
      "strippedText mismatch",
    );
    assert.deepStrictEqual(
      result.events,
      f.expectedEvents,
      "events mismatch",
    );
    const warned = getWarnings().length > 0;
    assert.strictEqual(
      warned,
      f.expectsWarn,
      `warn-fired mismatch: expected ${f.expectsWarn}, got ${warned}`,
    );
    passed++;
    console.log(`  ✅ [parse ${index + 1}/${PARSE_FIXTURES.length}] ${f.name}`);
  } catch (err) {
    failed++;
    console.error(`  ❌ [parse ${index + 1}/${PARSE_FIXTURES.length}] ${f.name}`);
    console.error(`     ${err instanceof Error ? err.message : String(err)}`);
    if (getWarnings().length > 0) {
      console.error(`     captured warns: ${JSON.stringify(getWarnings())}`);
    }
  }
}

function runMatchFixture(f: MatchFixture, index: number): void {
  try {
    const result = matchAssetByQuery(f.query, f.assets);
    const actualId = result === null ? null : result.id;
    assert.strictEqual(
      actualId,
      f.expectedId,
      `expected id ${f.expectedId}, got ${actualId}`,
    );
    passed++;
    console.log(`  ✅ [match ${index + 1}/${MATCH_FIXTURES.length}] ${f.name}`);
  } catch (err) {
    failed++;
    console.error(`  ❌ [match ${index + 1}/${MATCH_FIXTURES.length}] ${f.name}`);
    console.error(`     ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log("parseStageTags fixtures:");
PARSE_FIXTURES.forEach((f, i) => runParseFixture(f, i));

console.log("\nmatchAssetByQuery fixtures:");
MATCH_FIXTURES.forEach((f, i) => runMatchFixture(f, i));

const total = passed + failed;
if (failed === 0) {
  console.log(`\n✅ ${passed}/${total} fixtures passed`);
  process.exit(0);
} else {
  console.error(`\n❌ ${passed}/${total} fixtures passed (${failed} failed)`);
  process.exit(1);
}
