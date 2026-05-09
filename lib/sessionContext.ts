/**
 * SessionContext is the per-session bundle Mask receives when a session
 * loads — sourced from a joined read of the `sessions` row plus its
 * `track`, `cohort`, and `college` parents. The chat route stitches it
 * into the system prompt so Mask can open with callbacks like
 * "Welcome back, last week we did wallets, today transactions."
 *
 * This type is split from the loader implementation so the contract
 * can be locked before any consumer reads it. The loader (micro 2)
 * and the chat-route consumer (micro 3 of substep 2b.2.3) are then
 * reviewed against the same anchor instead of the loader's return
 * type drifting under the consumer.
 *
 * The loader function `loadSessionContext()` arrives in micro 2 of
 * substep 2b.2.1.
 */
export type SessionContext = {
  sessionNumber: number | null;
  topic: string;
  brief: Record<string, unknown> | null;
  trackName: string;
  trackTotalSessions: number | null;
  cohortName: string;
  collegeName: string;
};
