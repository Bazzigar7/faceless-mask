import { supabase } from './supabase';
import type { Json } from './database.types';
import type { SessionBrief } from './banks/types';

/**
 * Updates an existing session row by id. Track is intentionally
 * NOT in UpdateSessionInput — moving a session between tracks is
 * a Supabase dashboard operation in V1 (uncommon, structurally
 * disruptive, deferred until a real workflow demands it).
 *
 * @throws Re-throws any Supabase update error so the API route
 *   can return a 500 with the error message.
 */
export type UpdateSessionInput = {
  sessionNumber: number | null;
  topic: string;
  date: string;
  brief: SessionBrief | null;
};

export async function updateSession(
  sessionId: string,
  input: UpdateSessionInput,
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({
      session_number: input.sessionNumber,
      topic: input.topic,
      date: input.date,
      // brief is SessionBrief | null in our type but Supabase expects
      // Json — cast at the boundary. See createSession for context.
      brief: input.brief as Json,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('[updateSession] Update failed:', error);
    throw error;
  }
}
