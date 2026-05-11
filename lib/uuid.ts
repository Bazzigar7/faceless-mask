/**
 * Shared UUID validation regex for admin route path gates and loader
 * input validation. Matches the standard 8-4-4-4-12 lowercase or
 * uppercase hex form (case-insensitive via `/i` flag).
 *
 * Extracted at 2c.1.1 on third-use trigger — previously inlined in
 * lib/sessionContext.ts (loader gate) and app/api/admin/sessions/
 * route.ts (POST trackId gate). The PUT route's new params.id gate
 * is the third site; consolidating now retires the duplication.
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
