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
