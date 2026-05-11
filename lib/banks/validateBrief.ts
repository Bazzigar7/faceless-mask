// lib/banks/validateBrief.ts
import type { SessionBrief } from "./types";
import { OPENER_BANK } from "./openers";
import { ACTIVITY_BANK } from "./activities";
import { STORY_BANK } from "./stories";

/**
 * Result of validating a sessions.brief value at the API write
 * boundary. Discriminated union matching the parseBrief vocabulary
 * (5.1.1.0) — consumers narrow via `if (result.ok)`.
 *
 *   { ok: true,  brief: null }            → input was null
 *   { ok: true,  brief: SessionBrief }    → input passed all checks
 *                                          (including the vacuous
 *                                          empty-object `{}` case)
 *   { ok: false, errors: string[] }       → one or more violations.
 *                                          ALL errors collected,
 *                                          not first-fail.
 */
export type ValidationResult =
  | { ok: true; brief: SessionBrief | null }
  | { ok: false; errors: string[] };

const RECOGNIZED_KEYS: ReadonlySet<string> = new Set([
  "openerId",
  "activityIds",
  "storyIds",
  "customNotes",
]);

/**
 * Validate a candidate sessions.brief value at the API write
 * boundary.
 *
 * Parameter type is `unknown` (NOT SessionBrief | null, NOT
 * Record<string, unknown> | null) — this is the function whose
 * entire purpose is to narrow untrusted input (raw JSON.parse
 * output from the HTTP body) into a typed SessionBrief. Asserting
 * any stricter parameter type would contradict the validator's
 * role. Internally, after `typeof brief !== "object"` and
 * `Array.isArray(brief)` checks rule out non-object inputs, we
 * narrow once via `const b = brief as Record<string, unknown>` to
 * enable field-by-field access; the typeof check above guarantees
 * the cast is safe at runtime. This is the standard "validate
 * untrusted input" pattern — keep the parameter `unknown` so
 * future-Claude-Code doesn't "fix" the signature to a typed input
 * (which would defeat the validator).
 *
 * Rules (errors collected, not first-fail):
 *   - null → ok: true, brief: null (early return)
 *   - Non-object input (primitive, array) → single error
 *     "Brief must be an object or null"
 *   - Unknown top-level keys (anything outside openerId /
 *     activityIds / storyIds / customNotes) → one error per
 *     unknown key. Surfaced before per-field violations so
 *     misspellings ("openrId") appear first in the error list.
 *   - openerId present but not string → "openerId must be a string"
 *   - openerId is string but not in OPENER_BANK →
 *     `Unknown openerId: "<value>"`
 *   - activityIds present but not array → "activityIds must be an array"
 *   - activityIds entry not string → per-entry error
 *   - activityIds entry not in ACTIVITY_BANK → per-entry
 *     `Unknown activityId: "<value>"`
 *   - storyIds: same pattern as activityIds against STORY_BANK
 *   - customNotes present but not string → "customNotes must be a string"
 *
 * Accepted edge cases:
 *   - Empty arrays (activityIds: [], storyIds: []) — form
 *     serialization omits empties away from the wire anyway, but
 *     direct API hits with empty arrays are accepted.
 *   - Empty object {} — vacuously passes all checks (no unknown
 *     keys, no field violations). Round-trips through validator
 *     unchanged; downstream parseBrief classifies it as legacy
 *     (no structured keys) so it renders via the legacy JSON
 *     fallback. Operator error from direct API hits is the only
 *     way this lands — the form never produces {}.
 *
 * NOT enforced (V1 scope, deferred):
 *   - Length caps on customNotes
 *   - Cardinality caps on activityIds / storyIds (UI says
 *     "pick 0–2" / "pick 0–3" — soft caps, not server-enforced)
 *
 * Validator validates; it does NOT transform. Inputs flow through
 * verbatim on success — no coercion of {} to null, no field
 * stripping, no normalization. See 5.2.0 plan decision (i).
 */
export function validateBrief(brief: unknown): ValidationResult {
  if (brief === null) {
    return { ok: true, brief: null };
  }

  // typeof [] === "object" and typeof null === "object" — null is
  // handled above; arrays caught here via Array.isArray short-circuit.
  if (typeof brief !== "object" || Array.isArray(brief)) {
    return { ok: false, errors: ["Brief must be an object or null"] };
  }

  // After the null + non-object/array checks above, `brief` is some
  // object that TS can't narrow further without an assertion. Cast
  // to Record<string, unknown> for field-by-field access; the
  // typeof check above guarantees this is safe at runtime.
  const b = brief as Record<string, unknown>;

  const errors: string[] = [];

  // Unknown top-level keys first.
  for (const key of Object.keys(b)) {
    if (!RECOGNIZED_KEYS.has(key)) {
      errors.push(`Unknown brief field: "${key}"`);
    }
  }

  // Per-field validation in SessionBrief declaration order:
  // openerId → activityIds → storyIds → customNotes.

  if ("openerId" in b) {
    const v = b.openerId;
    if (typeof v !== "string") {
      errors.push("openerId must be a string");
    } else if (!OPENER_BANK.some((o) => o.id === v)) {
      errors.push(`Unknown openerId: "${v}"`);
    }
  }

  if ("activityIds" in b) {
    const v = b.activityIds;
    if (!Array.isArray(v)) {
      errors.push("activityIds must be an array");
    } else {
      for (const entry of v) {
        if (typeof entry !== "string") {
          errors.push(
            `activityIds entries must be strings, got: ${JSON.stringify(entry)}`,
          );
        } else if (!ACTIVITY_BANK.some((a) => a.id === entry)) {
          errors.push(`Unknown activityId: "${entry}"`);
        }
      }
    }
  }

  if ("storyIds" in b) {
    const v = b.storyIds;
    if (!Array.isArray(v)) {
      errors.push("storyIds must be an array");
    } else {
      for (const entry of v) {
        if (typeof entry !== "string") {
          errors.push(
            `storyIds entries must be strings, got: ${JSON.stringify(entry)}`,
          );
        } else if (!STORY_BANK.some((s) => s.id === entry)) {
          errors.push(`Unknown storyId: "${entry}"`);
        }
      }
    }
  }

  if ("customNotes" in b) {
    const v = b.customNotes;
    if (typeof v !== "string") {
      errors.push("customNotes must be a string");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, brief: b as SessionBrief };
}
