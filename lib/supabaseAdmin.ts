import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Server-side Supabase client using the service role key.
 *
 * Bypasses Row-Level Security policies. Use this for all
 * server-origin queries — API routes, server components, lib
 * helpers consumed by server code. The client-facing supabase
 * client (lib/supabase.ts) uses the anon key and is subject
 * to RLS; never import it into server-only code paths.
 *
 * SECURITY: SUPABASE_SERVICE_ROLE_KEY must never be exposed
 * to the browser. It is NOT NEXT_PUBLIC_ prefixed; importing
 * this file into a Client Component will fail at build time
 * (process.env.SUPABASE_SERVICE_ROLE_KEY is undefined
 * client-side).
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
