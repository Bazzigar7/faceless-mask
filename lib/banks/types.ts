// lib/banks/types.ts
// Data shapes for Mask's joke / opener / activity / story banks.
// Banks are pure data — rendering lives in lib/personality.ts.

export type JokeCategory =
  | "crypto"
  | "indian-college"
  | "self-aware-ai"
  | "ai"
  | "content"
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

// Shape of sessions.brief end-to-end (all fields optional, empty {}
// is valid). SessionBrief is the declared type across all public
// boundaries — SessionContext, CreateSessionInput, UpdateSessionInput,
// SessionForm's ExistingSession, and the API route Partial<...> casts.
// validateBrief() enforces this shape at the API write boundary;
// parseBrief() classifies inputs into structured / legacy / empty at
// the read boundary. Legacy DB content (any sessions.brief written
// pre-5.2.0 validator, if any exist) can still defeat the loader's
// `as SessionBrief` assertion at runtime; parseBrief's "legacy" branch
// handles that case defensively.
export interface SessionBrief {
  openerId?: string;
  activityIds?: string[];
  storyIds?: string[];
  customNotes?: string;
}
