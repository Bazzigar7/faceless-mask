import { supabase } from './supabase';

/**
 * Writes a single turn to the turns table — one row per voice-
 * loop turn. Called twice per chat round-trip: once with role
 * 'user' (Baz's transcript) before the Claude call, once with
 * role 'assistant' (Mask's response) inside finalMessage().then.
 *
 * The chat route wraps this with a graceful-degrade variant
 * (writeTurnSafe) so DB failures don't break voice continuity.
 * writeTurn itself throws on real errors — callers decide
 * whether to swallow.
 *
 * Ordering across turns is implicit: created_at TIMESTAMPTZ
 * with default now(). Read-side queries order by created_at
 * ASC to reconstruct conversation flow.
 *
 * @throws Re-throws any Supabase insert error (network, schema
 *   violation, FK constraint, CHECK constraint on role, etc.)
 *   so the chat route can log + continue.
 */
export async function writeTurn(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from('turns')
    .insert({ session_id: sessionId, role, content });

  if (error) {
    console.error('[writeTurn] Insert failed:', error);
    throw error;
  }
}
