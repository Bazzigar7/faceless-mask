import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { SentenceAlignment, Viseme } from './types';
import { charToViseme } from './visemeMapping';

export function useLipSync(
  audioRef: RefObject<HTMLAudioElement | null>,
  alignmentStoreRef: RefObject<SentenceAlignment[]>,
): Viseme {
  const [viseme, setViseme] = useState<Viseme>('rest');

  useEffect(() => {
    let frameId: number | null = null;
    let lastViseme: Viseme = 'rest';

    function tick() {
      const audio = audioRef.current;
      const store = alignmentStoreRef.current;
      let next: Viseme = 'rest';

      if (audio && store && !audio.paused && !audio.ended) {
        const t = audio.currentTime;
        for (const entry of store) {
          const ends = entry.alignment.character_end_times_seconds;
          const sentenceEnd = entry.audioStartTime + (ends[ends.length - 1] ?? 0);
          if (t >= entry.audioStartTime && t < sentenceEnd) {
            const localTime = t - entry.audioStartTime;
            const starts = entry.alignment.character_start_times_seconds;
            for (let i = 0; i < starts.length; i++) {
              if (localTime >= starts[i] && localTime < ends[i]) {
                next = charToViseme(entry.alignment.characters[i]);
                break;
              }
            }
            break;
          }
        }
      }

      if (next !== lastViseme) {
        lastViseme = next;
        setViseme(next);
      }
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [audioRef, alignmentStoreRef]);

  return viseme;
}
