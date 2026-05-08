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
