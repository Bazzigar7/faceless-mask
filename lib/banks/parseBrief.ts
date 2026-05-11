// lib/banks/parseBrief.ts
import type { SessionBrief } from "./types";

/**
 * Classification result for a sessions.brief value. Discriminated
 * union over the three shapes the formatter and admin UIs need to
 * distinguish:
 *
 *   - "structured": brief carries at least one SessionBrief key
 *     (openerId / activityIds / storyIds / customNotes). data is
 *     the same value typed as Partial<SessionBrief> for type-safe
 *     field access by consumers.
 *   - "legacy": brief is a non-null value that doesn't fit the
 *     structured shape at runtime. raw is the original runtime
 *     value typed as unknown — the legacy branch is only reachable
 *     when a type assertion at the read boundary turned out to be
 *     a lie. Consumers JSON.stringify it for opaque rendering.
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
  | { kind: "legacy"; raw: unknown }
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
 * Note (post-5.2.1): the type system now blocks malformed inputs
 * at parseBrief's call sites (SessionContext.brief,
 * ExistingSession.brief all typed SessionBrief | null). The table
 * above documents runtime-fallback behavior for the one boundary
 * where a type assertion lies — the loader's `as SessionBrief`
 * cast against pre-validator legacy DB rows — so parseBrief stays
 * defensively correct even when types lie.
 *
 * For valid SessionBrief inputs the two predicates produce
 * identical classifications. For malformed inputs (a non-array
 * landing in activityIds or storyIds) parseBrief routes safely to
 * legacy JSON dump instead of throwing or mis-routing through the
 * structured path. Same tightening applies to storyIds.
 */
export function parseBrief(
  brief: SessionBrief | null,
): ParsedBrief {
  if (brief === null) return { kind: "empty" };
  const hasStructured =
    brief.openerId !== undefined ||
    (Array.isArray(brief.activityIds) && brief.activityIds.length > 0) ||
    (Array.isArray(brief.storyIds) && brief.storyIds.length > 0) ||
    brief.customNotes !== undefined;
  return hasStructured
    ? { kind: "structured", data: brief }
    : { kind: "legacy", raw: brief };
}
