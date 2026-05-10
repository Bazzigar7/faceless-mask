import type { SessionContext } from './sessionContext';

/**
 * Formats a SessionContext into instructional prose for Claude's
 * system prompt block 2. The result tells Mask three things: the
 * current situation (cohort/track/session/topic), how to use that
 * context (open with awareness, callback to past sessions, stay
 * on topic), and the approved brief if one exists.
 *
 * Block 2 sits AFTER the personality prompt (block 1) in the
 * system array, with its own ephemeral cache_control. The
 * personality cache survives across all sessions; block 2 caches
 * across all turns within one session.
 *
 * formatSessionContext is forward-compatible with sessions.brief:
 * handles null today, renders JSON.stringify when populated by
 * 2b.5 approval flow. Handles nullable schema fields (sessionNumber,
 * trackTotalSessions) by gracefully omitting from prose when null.
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

  parts.push(`How to use this context: when the session opens, acknowledge where they are in the curriculum (e.g. "Welcome back, last time we covered X, today we're on Y"). Reference earlier sessions when natural. Keep today's topic in focus — if a question drifts off-topic, you can engage briefly but bring it back.`);

  if (ctx.brief !== null) {
    parts.push(`Approved session brief from Baz:\n${JSON.stringify(ctx.brief, null, 2)}`);
  }

  return parts.join('\n\n');
}
