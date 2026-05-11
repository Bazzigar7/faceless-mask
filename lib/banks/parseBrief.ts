// lib/banks/parseBrief.ts
import type { SessionBrief } from "./types";

/**
 * Classification result for a sessions.brief value. Discriminated
 * union over the three shapes the formatter and admin UIs need to
 * distinguish:
 *
 *   - "structured": brief carries at least one SessionBrief key
 *     (openerId / activityIds / storyIds / customNotes). data is
 *     the same object cast to Partial<SessionBrief> for type-safe
 *     field access by consumers.
 *   - "legacy": brief is a non-null object without any of those
 *     keys. raw is the original object (callers typically
 *     JSON.stringify it for opaque rendering).
 *   - "empty": brief is null.
 *
 * Defensive against malformed inputs: Array.isArray guards on
 * activityIds and storyIds mean non-array values (null, strings,
 * numbers, objects) for those fields don't trip the structured
 * classification. See parseBrief docstring for the input-type
 * table.
 */
export type ParsedBrief =
  | { kind: "structured"; data: Partial<SessionBrief> }
  | { kind: "legacy"; raw: Record<string, unknown> }
  | { kind: "empty" };

/**
 * Classify a sessions.brief value into structured / legacy / empty.
 *
 * Behavioral tightening over 5.1.0's inline predicate: 5.1.0 used
 * `b.activityIds !== undefined && b.activityIds.length > 0`, which
 * accepts any non-undefined value and then accesses .length. That
 * is fragile under malformed inputs:
 *
 *   activityIds value | 5.1.0 inline predicate         | parseBrief
 *   ------------------+--------------------------------+-------------
 *   undefined         | false (short-circuit)          | false
 *   []                | true && 0>0  → false           | false
 *   ["a","b"]         | true && true → true            | true
 *   null              | true → THROWS on .length       | false (safe)
 *   "single-id"       | true && len>0 → true (wrong)   | false (safe)
 *   42 (number)       | true && undefined>0 → false    | false
 *   {} (object)       | true && undefined>0 → false    | false
 *
 * For valid SessionBrief inputs the two predicates produce
 * identical classifications. For malformed inputs (a non-array
 * landing in activityIds or storyIds) parseBrief routes safely to
 * legacy JSON dump instead of throwing or mis-routing through the
 * structured path. Same tightening applies to storyIds.
 */
export function parseBrief(
  brief: Record<string, unknown> | null,
): ParsedBrief {
  if (brief === null) return { kind: "empty" };
  const b = brief as Partial<SessionBrief>;
  const hasStructured =
    b.openerId !== undefined ||
    (Array.isArray(b.activityIds) && b.activityIds.length > 0) ||
    (Array.isArray(b.storyIds) && b.storyIds.length > 0) ||
    b.customNotes !== undefined;
  return hasStructured
    ? { kind: "structured", data: b }
    : { kind: "legacy", raw: brief };
}
