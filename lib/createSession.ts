import { supabaseAdmin as supabase } from './supabaseAdmin';
import type { Json } from './database.types';
import type { SessionBrief } from './banks/types';

/**
 * Inserts a new session row, returning the new session's id.
 * Called by POST /api/admin/sessions when the create form submits.
 *
 * Field mapping camelCase → snake_case happens here so callers
 * (forms, API routes) work in TS-idiomatic naming.
 *
 * @throws Re-throws any Supabase insert error (FK violation on
 *   trackId, network, schema mismatch, etc.) so the API route
 *   can return a 500 with the error message.
 */
export type CreateSessionInput = {
  trackId: string;
  sessionNumber: number | null;
  topic: string;
  date: string;
  brief: SessionBrief | null;
};

export async function createSession(input: CreateSessionInput): Promise<string> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      track_id: input.trackId,
      session_number: input.sessionNumber,
      topic: input.topic,
      date: input.date,
      // brief is SessionBrief | null in our type but Supabase expects
      // Json — cast at the boundary. Validator at the API route
      // guarantees the typed shape; this cast widens for the DB layer.
      brief: input.brief as Json,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createSession] Insert failed:', error);
    throw error;
  }
  if (!data) {
    throw new Error('createSession: insert returned no row');
  }

  return data.id;
}
