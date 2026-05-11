/**
 * Result of validating a sessions.summary value at the API write
 * boundary. Discriminated union matching validateBrief's vocabulary —
 * consumers narrow via `if (result.ok)`.
 *
 *   { ok: true,  summary: null }          → input was null
 *   { ok: true,  summary: string }        → input passed string check
 *                                          (rendered verbatim including
 *                                          empty string and whitespace-
 *                                          only — see fail-loud note)
 *   { ok: false, errors: string[] }       → typeof mismatch. Plural
 *                                          shape preserved for symmetry
 *                                          with validateBrief; only one
 *                                          rule fires today.
 */
export type SummaryValidationResult =
  | { ok: true; summary: string | null }
  | { ok: false; errors: string[] };

/**
 * Validate a candidate sessions.summary value at the API write
 * boundary.
 *
 * Parameter type is `unknown` (NOT string | null) — this is the
 * function whose entire purpose is to narrow untrusted input (raw
 * JSON.parse output from the HTTP body) into a typed string | null.
 * Asserting any stricter parameter type would contradict the
 * validator's role. The PUT route's body cast (`as
 * Partial<UpdateSessionInput>`) is the trust-boundary lie; this
 * validator is the truth. Keep the parameter `unknown` so
 * future-Claude-Code doesn't "fix" the signature to a typed input
 * (which would defeat the validator).
 *
 * Rules:
 *   - null → ok: true, summary: null (early return)
 *   - Non-string non-null (number, object, array, boolean) → single
 *     error "Summary must be a string or null"
 *   - Any string → ok: true, summary: <verbatim>
 *
 * Accepted edge cases:
 *   - Empty string "" — passes through. The formatter renders it
 *     verbatim as `Last session: ` (trailing space, empty body) so
 *     a data-quality issue surfaces visibly in Mask's next session
 *     instead of silently masking. Same fail-loud principle as the
 *     2b.6.2 empty-string-renders-verbatim decision.
 *   - Whitespace-only string ("   ") — also passes. Trimming
 *     belongs in the form layer if anywhere, not the validator.
 *
 * NOT enforced (V1 scope, deferred):
 *   - Length cap on summary text. Mirrors validateBrief's
 *     customNotes-no-cap precedent.
 *   - Content rules (no leading/trailing whitespace, no control
 *     characters, etc.).
 *
 * Validator validates; it does NOT transform. Inputs flow through
 * verbatim on success — no coercion of "" to null, no trim, no
 * normalization. Mirror of validateBrief's no-transform contract.
 */
export function validateSummary(data: unknown): SummaryValidationResult {
  if (data === null) {
    return { ok: true, summary: null };
  }
  if (typeof data !== "string") {
    return { ok: false, errors: ["Summary must be a string or null"] };
  }
  return { ok: true, summary: data };
}
