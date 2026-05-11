// lib/banks/types.ts
// Data shapes for Mask's joke / opener / activity / story banks.
// Banks are pure data — rendering lives in lib/personality.ts.

export type JokeCategory =
  | "crypto"
  | "indian-college"
  | "self-aware-ai"
  | "bad-jokes-mask-owns"
  | "callback-jokes";

export interface Joke {
  id: string;
  number: number;
  category: JokeCategory;
  body: string;
  // Present only on callback-jokes — rendered as `<number>. <prefix>: "<body>"`.
  contextPrefix?: string;
}

export type OpenerCategory =
  | "joke"
  | "activity"
  | "hook"
  | "roast"
  | "vibe"
  | "self-aware";

export interface Opener {
  id: string;
  category: OpenerCategory;
  body: string;
}

export interface Story {
  id: string;
  name: string;
  body: string;
}

export type ActivityCategory =
  | "classic-indian-school-games"
  | "crypto-native";

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  body: string;
  // Present only on "1-2-3 Cluster" — appended after the quoted name in the heading.
  headingSuffix?: string;
}

// Shape of sessions.brief once Phase 2b.5.1 picker UI lands.
// All fields optional; the empty object {} is valid (renders nothing).
// formatSessionContext consumes this shape via `as Partial<SessionBrief>`
// at the runtime boundary — public types upstream (sessionContext.ts,
// createSession.ts, updateSession.ts, API routes) keep the permissive
// Record<string, unknown> | null until 2b.5.1.2 introduces server-side
// validation.
export interface SessionBrief {
  openerId?: string;
  activityIds?: string[];
  storyIds?: string[];
  customNotes?: string;
}
