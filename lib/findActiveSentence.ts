import type { SentenceAlignment } from './types';

/**
 * Returns the entry whose half-open audio interval contains
 * `currentTime`, or null. Shared by useLipSync and useCurrentWord;
 * captured 2026-05-08 during the 2a.5.2 useCurrentWord plan
 * (docs/faceless-toolkit.md L55-58), deferred until Phase 3.1.2.4.
 *
 * Half-open `[audioStartTime, audioStartTime + lastEnd)` is
 * deliberate — handles audioStartTime = 0 cleanly. `lastEnd`
 * falls back to 0 for empty character_end_times_seconds (parity
 * with the prior inline loops).
 *
 * Null callers: useLipSync goes to 'rest'; useCurrentWord falls
 * back to its held-sentence ref.
 */
export function findActiveSentence(
  currentTime: number,
  store: SentenceAlignment[],
): SentenceAlignment | null {
  for (const entry of store) {
    const ends = entry.alignment.character_end_times_seconds;
    const sentenceEnd = entry.audioStartTime + (ends[ends.length - 1] ?? 0);
    if (currentTime >= entry.audioStartTime && currentTime < sentenceEnd) {
      return entry;
    }
  }
  return null;
}
