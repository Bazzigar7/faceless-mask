import { supabase } from './supabase';
import { UUID_REGEX } from './uuid';
import type { SessionBrief } from './banks/types';

/**
 * SessionContext is the per-session bundle Mask receives when a session
 * loads — sourced from a joined read of the `sessions` row plus its
 * `track`, `cohort`, and `college` parents. The chat route stitches it
 * into the system prompt so Mask can open with callbacks like
 * "Welcome back, last week we did wallets, today transactions."
 *
 * This type is split from the loader implementation so the contract
 * can be locked before any consumer reads it. The loader (micro 2)
 * and the chat-route consumer (micro 3 of substep 2b.2.3) are then
 * reviewed against the same anchor instead of the loader's return
 * type drifting under the consumer.
 *
 * The loader function `loadSessionContext()` arrives in micro 2 of
 * substep 2b.2.1.
 */
export type SessionContext = {
  sessionNumber: number | null;
  topic: string;
  date: string;
  trackId: string;
  brief: SessionBrief | null;
  trackName: string;
  trackTotalSessions: number | null;
  cohortName: string;
  collegeName: string;
  previousSummary: string | null;
  summary: string | null;
};

/**
 * Loads the per-session bundle Mask needs for today — topic plus
 * track/cohort/college parents — given a session UUID.
 *
 * @returns SessionContext on success; null when sessionId is not a
 * valid UUID, or when no session row exists with that id (PostgREST
 * code PGRST116). The two null cases are intentionally indistinguishable
 * to callers — both mean "no usable session, fall through to default".
 *
 * @throws Re-throws any DB error other than not-found (network failure,
 * permission error, malformed schema, etc.) so the chat route 500s
 * loudly instead of silently degrading. The error is also console.errored
 * before the throw for Vercel logs in 2b.4+.
 */
export async function loadSessionContext(
  sessionId: string,
): Promise<SessionContext | null> {
  if (!UUID_REGEX.test(sessionId)) return null;

  const { data, error } = await supabase
    .from('sessions')
    .select(
      `topic, session_number, date, brief, summary,
       track:tracks!inner (
         id, name, total_sessions,
         cohort:cohorts!inner (
           name,
           college:colleges!inner ( name )
         )
       )`,
    )
    .eq('id', sessionId)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) {
    console.error(error);
    throw error;
  }
  if (!data) return null;

  const previousSummary = await loadPreviousSummary(
    data.track.id,
    data.session_number,
  );

  return {
    sessionNumber: data.session_number,
    topic: data.topic,
    date: data.date,
    trackId: data.track.id,
    // brief is typed Json | null in the schema (Supabase's permissive
    // JSON type), but the 2b.5.2 validator guarantees writes conform
    // to SessionBrief. Cast narrows to that typed shape for downstream
    // consumers; runtime-incorrect DB content (pre-validator legacy
    // rows, if any exist) is handled by parseBrief's "legacy" branch.
    brief: data.brief === null
      ? null
      : (data.brief as SessionBrief),
    trackName: data.track.name,
    trackTotalSessions: data.track.total_sessions,
    cohortName: data.track.cohort.name,
    collegeName: data.track.cohort.college.name,
    previousSummary,
    summary: data.summary,
  };
}

/**
 * Loads the immediately-prior session's summary text for cross-session
 * memory recall — "last week we covered X, today Y" callbacks.
 *
 * "Prior" = same track, strictly-lower session_number, ordered DESC
 * LIMIT 1. Sessions with NULL session_number are filtered out
 * defensively so out-of-band rows (e.g. pilots, one-offs not part of
 * a numbered series) don't accidentally rank as predecessors.
 *
 * @returns The previous session's summary string, or null when:
 *   - currentSessionNumber is null (no ordering anchor)
 *   - no prior session exists in this track (PostgREST PGRST116)
 *   - prior session exists but its summary column is NULL
 * All three null cases are intentionally indistinguishable to
 * callers — all mean "no recall available, render no callback".
 *
 * @throws Re-throws any DB error other than not-found (network
 * failure, permission, schema) so the chat route can log + degrade
 * via loadSessionContextSafe rather than silently dropping recall.
 *
 * trackId is post-join trusted (sourced from loadSessionContext's
 * inner-join on tracks); no UUID-regex defense applied. Garbage
 * input would surface as a Supabase error and rethrow loudly.
 */
export async function loadPreviousSummary(
  trackId: string,
  currentSessionNumber: number | null,
): Promise<string | null> {
  if (currentSessionNumber === null) return null;

  const { data, error } = await supabase
    .from('sessions')
    .select('summary')
    .eq('track_id', trackId)
    .not('session_number', 'is', null)
    .lt('session_number', currentSessionNumber)
    .order('session_number', { ascending: false })
    .limit(1)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) {
    console.error(error);
    throw error;
  }
  return data?.summary ?? null;
}
