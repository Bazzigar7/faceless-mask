import { supabase } from './supabase';

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
  brief: Record<string, unknown> | null;
  trackName: string;
  trackTotalSessions: number | null;
  cohortName: string;
  collegeName: string;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      `topic, session_number, brief,
       track:tracks!inner (
         name, total_sessions,
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

  return {
    sessionNumber: data.session_number,
    topic: data.topic,
    // brief is typed Json | null in the schema (Supabase's permissive
    // JSON type) but in practice we only ever write objects to it from
    // the approval flow (2b.5). Cast narrows the type for downstream
    // consumers.
    brief: data.brief === null
      ? null
      : (data.brief as Record<string, unknown>),
    trackName: data.track.name,
    trackTotalSessions: data.track.total_sessions,
    cohortName: data.track.cohort.name,
    collegeName: data.track.cohort.college.name,
  };
}
