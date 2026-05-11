// Verifies that lib/personality.ts's exported MASK_SYSTEM_PROMPT
// matches the frozen snapshot at tests/snapshots/mask-system-prompt.txt
// byte-for-byte. Snapshot is the immutable contract for the Phase 2b.5
// bank refactor — any drift fails the check.
//
// Run via: npm run verify:prompt
// Exits 0 on match, 1 on mismatch (with a localized diff report) or
// missing snapshot.

import { readFileSync } from "fs";
import { resolve } from "path";
import { MASK_SYSTEM_PROMPT } from "../lib/personality";

const SNAPSHOT_PATH = resolve(
  process.cwd(),
  "tests/snapshots/mask-system-prompt.txt",
);

let snapshot: string;
try {
  snapshot = readFileSync(SNAPSHOT_PATH, "utf-8");
} catch (err) {
  console.error(`❌ Could not read snapshot at ${SNAPSHOT_PATH}`);
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

const actual = MASK_SYSTEM_PROMPT;

if (actual === snapshot) {
  const lines = actual.split("\n").length;
  const bytes = Buffer.byteLength(actual, "utf-8");
  console.log(
    `✅ MASK_SYSTEM_PROMPT matches snapshot (${bytes} bytes, ${lines} lines)`,
  );
  process.exit(0);
}

const snapBytes = Buffer.byteLength(snapshot, "utf-8");
const actBytes = Buffer.byteLength(actual, "utf-8");
console.error("❌ MASK_SYSTEM_PROMPT does NOT match snapshot");
console.error(`   snapshot bytes: ${snapBytes}`);
console.error(`   actual bytes:   ${actBytes}`);
console.error(`   delta:          ${actBytes - snapBytes}`);

const expLines = snapshot.split("\n");
const actLines = actual.split("\n");
const maxLen = Math.max(expLines.length, actLines.length);

let firstDiff = -1;
for (let i = 0; i < maxLen; i++) {
  if (expLines[i] !== actLines[i]) {
    firstDiff = i;
    break;
  }
}

if (firstDiff === -1) {
  console.error(
    "   (all lines match but byte lengths differ — likely trailing whitespace or newline)",
  );
} else {
  console.error(`\nFirst divergence at line ${firstDiff + 1}:`);
  const ctxStart = Math.max(0, firstDiff - 2);
  const ctxEnd = Math.min(maxLen, firstDiff + 3);
  for (let i = ctxStart; i < ctxEnd; i++) {
    const marker = i === firstDiff ? "> " : "  ";
    const exp = expLines[i] === undefined ? "<eof>" : JSON.stringify(expLines[i]);
    const act = actLines[i] === undefined ? "<eof>" : JSON.stringify(actLines[i]);
    console.error(`${marker}line ${i + 1}  expected: ${exp}`);
    console.error(`${marker}line ${i + 1}  actual:   ${act}`);
  }
}

process.exit(1);
