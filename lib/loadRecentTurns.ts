import { supabaseAdmin as supabase } from './supabaseAdmin';

/**
 * Sliding-window cap on how many prior turns are loaded for the
 * messages array. 8 turns = 4 round-trips of back-reference coverage,
 * ~1-1.5K uncached tokens per call beyond the cached system blocks.
 * Tune here if classroom usage shows the window too narrow or too wide.
 */
export const HISTORY_TURN_LIMIT = 8;

/**
 * Fetches the most recent N turns for a session, chronological
 * (oldest-first). Shape maps 1:1 to the Anthropic messages-array entry.
 * DESC + LIMIT + JS reverse is the standard "recent N chronologically"
 * pattern, served by idx_turns_session_created (session_id, created_at).
 * Filters to the strict role union (DB CHECK enforces it; generated
 * types are wider — runtime narrow keeps the return type tight, same
 * boundary-narrow pattern as listAssets).
 * @throws re-throws Supabase errors; chat route wraps in
 *   loadRecentTurnsSafe so voice continuity beats history fidelity.
 */
export async function loadRecentTurns(
  sessionId: string,
  limit: number,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const { data, error } = await supabase
    .from('turns')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[loadRecentTurns] Query failed:', error);
    throw error;
  }

  return (data ?? [])
    .filter((row): row is { role: 'user' | 'assistant'; content: string } =>
      row.role === 'user' || row.role === 'assistant',
    )
    .reverse();
}
