import { supabase } from './supabase';
import type { Database } from './database.types';
import type { Asset } from './types';

type AssetRow = Database['public']['Tables']['assets']['Row'];

// Boundary-narrowing type predicate. Generated DB types are wider
// than the hand-written Asset shape (see listAssets docstring); this
// predicate is the single source of truth for the conformance check.
function isAsset(row: AssetRow): row is Asset {
  return (
    (row.type === 'image' || row.type === 'video') &&
    row.url !== null &&
    row.tags !== null &&
    row.added_by !== null &&
    row.created_at !== null
  );
}

/**
 * Lists all assets in the library, consumed by VoiceLoop to resolve
 * <stage> tag queries via matchAssetByQuery (lib/visualCommands.ts).
 *
 * Returns an array of Asset. The Asset type from lib/types.ts maps
 * 1:1 to the assets table columns, so no row→item mapping is needed
 * here. Contrast with listSessions.ts, which maps !inner-joined rows
 * to a flatter shape — the shorter body here is intentional, not an
 * omission.
 *
 * Order: oldest first (created_at ascending). Seeded test rows
 * appear before any later additions, giving a stable preview order
 * during V1.
 *
 * Rows that violate the strict Asset shape (null url/tags/added_by/
 * created_at, or type other than 'image'|'video') are dropped with a
 * console.warn — the assets_type_check and tags NOT NULL constraints
 * from migration 20260516030000 prevent these from existing in
 * practice, but the boundary validator is belt-over-belt safety.
 *
 * @throws Re-throws any Supabase query error so the caller can
 *   surface it to the user.
 */
export async function listAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('id, type, url, storage_path, tags, alt_text, added_by, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[listAssets] Query failed:', error);
    throw error;
  }

  const valid: Asset[] = [];
  for (const row of data ?? []) {
    if (isAsset(row)) {
      valid.push(row);
    } else {
      console.warn('[listAssets] Dropping malformed row:', {
        id: row.id,
        reason: 'violates strict Asset shape',
      });
    }
  }
  return valid;
}
