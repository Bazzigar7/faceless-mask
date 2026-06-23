export type Viseme = 'rest' | 'closed' | 'open-a' | 'open-e' | 'open-o' | 'open-u';

export interface AlignmentData {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface WordSegment {
  text: string;
  startTime: number;
  endTime: number;
}

export interface SentenceAlignment {
  sentenceIndex: number;
  audioStartTime: number;
  alignment: AlignmentData;
  words?: WordSegment[];
}

// Stage / visual types — consumed by lib/visualCommands.ts (Phase 3.3.2)
// and rendered into the VoiceLoop stage event channel in Phase 3.3.3.

export type StageEvent =
  | { action: 'show'; query: string }
  | { action: 'hide' };

export type Asset = {
  id: string;
  type: 'image' | 'video';
  url: string;
  storage_path: string | null;
  tags: string[];
  exact_phrases: string[];
  alt_text: string | null;
  description: string | null;
  added_by: string;
  created_at: string;
};
