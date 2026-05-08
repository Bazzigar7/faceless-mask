import type { AlignmentData, WordSegment } from './types';

export function computeWordSegments(alignment: AlignmentData): WordSegment[] {
  const result: WordSegment[] = [];
  let buffer = '';
  let bufferStart: number | null = null;
  let bufferEnd: number | null = null;

  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i];
    if (/\s/.test(ch)) {
      if (buffer.length > 0 && bufferStart !== null && bufferEnd !== null) {
        result.push({ text: buffer, startTime: bufferStart, endTime: bufferEnd });
      }
      buffer = '';
      bufferStart = null;
      bufferEnd = null;
    } else {
      if (buffer.length === 0) {
        bufferStart = alignment.character_start_times_seconds[i];
      }
      buffer += ch;
      bufferEnd = alignment.character_end_times_seconds[i];
    }
  }

  if (buffer.length > 0 && bufferStart !== null && bufferEnd !== null) {
    result.push({ text: buffer, startTime: bufferStart, endTime: bufferEnd });
  }

  return result;
}
