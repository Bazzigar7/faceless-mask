import { supabaseAdmin as supabase } from './supabaseAdmin';

/**
 * Lists all sessions joined with parent track, cohort, and college
 * for the admin panel session list view.
 *
 * Returns an array of SessionListItem — flat, denormalized rows
 * suitable for table rendering. Uses !inner joins so any session
 * missing a parent chain is filtered out (data hygiene).
 *
 * Order: most recent date first (sessions.date DESC).
 *
 * @throws Re-throws any Supabase query error so the caller can
 *   surface it to the user.
 */
export type SessionListItem = {
  id: string;
  sessionNumber: number | null;
  topic: string;
  date: string;
  trackName: string;
  cohortName: string;
  collegeName: string;
};

export async function listSessions(): Promise<SessionListItem[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select(
      `id, session_number, topic, date,
       track:tracks!inner (
         name,
         cohort:cohorts!inner (
           name,
           college:colleges!inner ( name )
         )
       )`,
    )
    .order('date', { ascending: false });

  if (error) {
    console.error('[listSessions] Query failed:', error);
    throw error;
  }

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    sessionNumber: row.session_number,
    topic: row.topic,
    date: row.date,
    trackName: row.track.name,
    cohortName: row.track.cohort.name,
    collegeName: row.track.cohort.college.name,
  }));
}
