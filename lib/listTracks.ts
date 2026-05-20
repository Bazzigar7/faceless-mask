import { supabaseAdmin as supabase } from './supabaseAdmin';

/**
 * Lists all tracks joined with parent cohort and college, used by
 * the admin "new session" page to populate the track dropdown.
 *
 * Returns an array of TrackListItem — flat, denormalized rows
 * suitable for <option> rendering. Uses !inner joins so any track
 * missing a parent chain is filtered out (data hygiene).
 *
 * Order: alphabetical by college, then cohort, then track name.
 * Sort runs client-side after the query — PostgREST's chained
 * .order() with foreign-relation columns has version-dependent
 * syntax; .localeCompare on small N is reliable.
 *
 * @throws Re-throws any Supabase query error so the caller can
 *   surface it to the user.
 */
export type TrackListItem = {
  id: string;
  name: string;
  cohortName: string;
  collegeName: string;
  totalSessions: number | null;
};

export async function listTracks(): Promise<TrackListItem[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select(
      `id, name, total_sessions,
       cohort:cohorts!inner (
         name,
         college:colleges!inner ( name )
       )`,
    );

  if (error) {
    console.error('[listTracks] Query failed:', error);
    throw error;
  }

  if (!data) return [];

  return data
    .map((row) => ({
      id: row.id,
      name: row.name,
      cohortName: row.cohort.name,
      collegeName: row.cohort.college.name,
      totalSessions: row.total_sessions,
    }))
    .sort((a, b) => {
      if (a.collegeName !== b.collegeName) return a.collegeName.localeCompare(b.collegeName);
      if (a.cohortName !== b.cohortName) return a.cohortName.localeCompare(b.cohortName);
      return a.name.localeCompare(b.name);
    });
}
