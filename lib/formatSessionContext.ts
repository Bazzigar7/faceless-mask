import type { SessionContext } from './sessionContext';
import { OPENER_BANK } from './banks/openers';
import { ACTIVITY_BANK } from './banks/activities';
import { STORY_BANK } from './banks/stories';
import type { SessionBrief, Activity, Story } from './banks/types';

/**
 * Formats a SessionContext into instructional prose for Claude's
 * system prompt block 2. The result tells Mask three things: the
 * current situation (cohort/track/session/topic), how to use that
 * context (open with awareness, callback to past sessions, stay
 * on topic, treat primed stories/activities as references), and
 * the approved brief if one exists.
 *
 * Block 2 sits AFTER the personality prompt (block 1) in the
 * system array, with its own ephemeral cache_control. The
 * personality cache survives across all sessions; block 2 caches
 * across all turns within one session.
 *
 * Brief rendering (Phase 2b.5.1.0):
 *   - Structured briefs (any of openerId / activityIds / storyIds /
 *     customNotes present) inline the bank bodies: opener body,
 *     activity bodies, story bodies looked up from lib/banks/*,
 *     plus customNotes as free prose. Sections joined with \n\n in
 *     fixed order (opener → activities → stories → notes).
 *   - Legacy free-form briefs (none of those keys present) render as
 *     `Approved session brief from Baz:\n${JSON.stringify(...)}`.
 *   - Defensive fall-through: if a brief HAS structured keys but
 *     every ID lookup fails and customNotes is empty, falls through
 *     to the legacy JSON render so Baz can debug stale IDs. Server-
 *     side validation in 2b.5.1.2 will prevent this at write time.
 *
 * Nullable schema fields (sessionNumber, trackTotalSessions) are
 * gracefully omitted from prose when null.
 */
export function formatSessionContext(ctx: SessionContext): string {
  const parts: string[] = [];

  parts.push('You are running a real session right now, co-hosting with Baz.');

  let positionPhrase: string;
  if (ctx.sessionNumber !== null && ctx.trackTotalSessions !== null) {
    positionPhrase = `this is session ${ctx.sessionNumber} of ${ctx.trackTotalSessions} in`;
  } else if (ctx.sessionNumber !== null) {
    positionPhrase = `this is session ${ctx.sessionNumber} in`;
  } else {
    positionPhrase = 'this is a session in';
  }
  const trackPhrase = `the "${ctx.trackName}" track`;
  const cohortPhrase = `for the ${ctx.cohortName} cohort at ${ctx.collegeName}`;
  const topicPhrase = `Today's topic is "${ctx.topic}".`;
  parts.push(`Today's session: ${positionPhrase} ${trackPhrase} ${cohortPhrase}. ${topicPhrase}`);

  parts.push(`How to use this context: when the session opens, acknowledge where they are in the curriculum (e.g. "Welcome back, last time we covered X, today we're on Y"). Reference earlier sessions when natural. Keep today's topic in focus — if a question drifts off-topic, you can engage briefly but bring it back. When today's brief primes a story or activity, treat its body as your reference — quote it tightly or riff off it, but don't substitute a different story or activity for one Baz approved.`);

  if (ctx.brief !== null) {
    const brief = ctx.brief as Partial<SessionBrief>;
    const hasStructured =
      brief.openerId !== undefined ||
      (brief.activityIds !== undefined && brief.activityIds.length > 0) ||
      (brief.storyIds !== undefined && brief.storyIds.length > 0) ||
      brief.customNotes !== undefined;

    if (hasStructured) {
      const sections: string[] = [];

      if (brief.openerId) {
        const o = OPENER_BANK.find((x) => x.id === brief.openerId);
        if (o) {
          sections.push(`Today's approved opener (${o.category}):\n"${o.body}"`);
        }
      }

      if (brief.activityIds && brief.activityIds.length > 0) {
        const activities = brief.activityIds
          .map((id) => ACTIVITY_BANK.find((a) => a.id === id))
          .filter((a): a is Activity => a !== undefined);
        if (activities.length > 0) {
          sections.push(
            `Activities primed for today (Baz will call them):\n` +
              activities.map((a) => `- ${a.name}: ${a.body}`).join('\n\n'),
          );
        }
      }

      if (brief.storyIds && brief.storyIds.length > 0) {
        const stories = brief.storyIds
          .map((id) => STORY_BANK.find((s) => s.id === id))
          .filter((s): s is Story => s !== undefined);
        if (stories.length > 0) {
          sections.push(
            `Stories you're primed to tell today if Baz cues you:\n` +
              stories.map((s) => `- ${s.name}: ${s.body}`).join('\n\n'),
          );
        }
      }

      if (brief.customNotes) {
        sections.push(`Baz's session-specific notes:\n${brief.customNotes}`);
      }

      if (sections.length > 0) {
        parts.push(sections.join('\n\n'));
      } else {
        // hasStructured was true but every lookup failed and customNotes
        // was empty. Fall through to legacy JSON render as a diagnostic
        // fallback so Baz can spot stale IDs. 2b.5.1.2 server-side
        // validation will prevent this at write time.
        parts.push(`Approved session brief from Baz:\n${JSON.stringify(ctx.brief, null, 2)}`);
      }
    } else {
      // Legacy free-form brief — preserve original behavior verbatim.
      parts.push(`Approved session brief from Baz:\n${JSON.stringify(ctx.brief, null, 2)}`);
    }
  }

  return parts.join('\n\n');
}
