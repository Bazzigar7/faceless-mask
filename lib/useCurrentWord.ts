import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { SentenceAlignment } from './types';
import { findActiveSentence } from './findActiveSentence';

export interface WordState {
  sentenceIndex: number | null;
  activeWordIndex: number | null;
  sentence: SentenceAlignment | null;
}

const INITIAL: WordState = { sentenceIndex: null, activeWordIndex: null, sentence: null };

export function useCurrentWord(
  audioRef: RefObject<HTMLAudioElement | null>,
  alignmentStoreRef: RefObject<SentenceAlignment[]>,
): WordState {
  const [state, setState] = useState<WordState>(INITIAL);

  useEffect(() => {
    let frameId: number | null = null;
    let lastSentenceIndex: number | null = null;
    let lastWordIndex: number | null = null;
    let lastSentence: SentenceAlignment | null = null;
    let heldSentence: SentenceAlignment | null = null;

    function tick() {
      const audio = audioRef.current;
      const store = alignmentStoreRef.current;

      // Reset rule (a): store cleared AND audio not playing → drop held sentence
      if (
        heldSentence &&
        (!store || store.length === 0) &&
        (!audio || audio.paused || audio.ended)
      ) {
        heldSentence = null;
      }
      // Reset rule (b): held sentence is no longer present in the store (object identity)
      if (heldSentence && store) {
        const stillPresent = store.some((s) => s === heldSentence);
        if (!stillPresent) heldSentence = null;
      }

      let nextSentenceIndex: number | null = null;
      let nextWordIndex: number | null = null;
      let nextSentence: SentenceAlignment | null = null;

      if (audio && store && !audio.paused && !audio.ended) {
        const t = audio.currentTime;
        const active = findActiveSentence(t, store);

        if (active) {
          heldSentence = active;
          nextSentence = active;
          nextSentenceIndex = active.sentenceIndex;
          const relativeTime = t - active.audioStartTime;
          const words = active.words ?? [];
          for (let i = 0; i < words.length; i++) {
            if (relativeTime >= words[i].startTime && relativeTime < words[i].endTime) {
              nextWordIndex = i;
              break;
            }
          }
        } else if (heldSentence) {
          // Gap between sentences — keep held sentence visible, no active word
          nextSentence = heldSentence;
          nextSentenceIndex = heldSentence.sentenceIndex;
          nextWordIndex = null;
        }
      }

      if (
        nextSentenceIndex !== lastSentenceIndex ||
        nextWordIndex !== lastWordIndex ||
        nextSentence !== lastSentence
      ) {
        lastSentenceIndex = nextSentenceIndex;
        lastWordIndex = nextWordIndex;
        lastSentence = nextSentence;
        setState({
          sentenceIndex: nextSentenceIndex,
          activeWordIndex: nextWordIndex,
          sentence: nextSentence,
        });
      }
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [audioRef, alignmentStoreRef]);

  return state;
}
