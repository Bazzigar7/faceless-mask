"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AlignmentData, Asset, SentenceAlignment, Viseme } from "@/lib/types";
import { useLipSync } from "@/lib/useLipSync";
import { useCurrentWord, type WordState } from "@/lib/useCurrentWord";
import { computeWordSegments } from "@/lib/wordSegments";
import { parseStageTags, matchAssetByQuery } from "@/lib/visualCommands";
import { type Status } from "./StatusIndicator";
import WakeWord from "./WakeWord";

const MIN_CHUNK_CHARS = 40;
const SENTENCE_END = /[.!?]\s/;

export default function VoiceLoop({
  onStatusChange,
  onVisemeChange,
  onWordStateChange,
  onMatchedAssetChange,
  sessionId,
}: {
  onStatusChange?: (status: Status) => void;
  onVisemeChange?: (viseme: Viseme) => void;
  onWordStateChange?: (state: WordState) => void;
  onMatchedAssetChange?: (asset: Asset | null) => void;
  sessionId?: string;
} = {}) {
  const [status, setStatus] = useState<Status>("idle");
  const [matchedAsset, setMatchedAsset] = useState<Asset | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const appendQueueRef = useRef<ArrayBuffer[]>([]);
  const ttsQueueRef = useRef<Promise<void>>(Promise.resolve());
  const alignmentStoreRef = useRef<SentenceAlignment[]>([]);
  const cumulativeAudioDurationRef = useRef<number>(0);
  const finishedChatRef = useRef(false);
  // Read inside runPipeline's streaming loop, which is useCallback'd
  // without `assets` in its deps — assetsRef bypasses stale closure.
  const assetsRef = useRef<Asset[]>([]);

  // Phase 3.5 interrupt engine plumbing (3.5.1 dormant infra).
  // pipelineAbortRef holds the per-pipeline AbortController so its
  // signal can be threaded into chat/STT/ttsChunk fetches and
  // cancelled by interrupt() (lands in 3.5.2 with the temp trigger).
  // audioEndResolveRef stashes the resolve fn of the line-320 audio-
  // end-await Promise so interrupt() can unwedge it on a pause path
  // (audio.pause() does NOT fire "ended"). On a normal turn the
  // "ended" event still resolves the Promise first — these refs are
  // pure infrastructure with no reachable caller in 3.5.1.
  const pipelineAbortRef = useRef<AbortController | null>(null);
  const audioEndResolveRef = useRef<(() => void) | null>(null);
  // interruptingRef is LOAD-BEARING FOR TOUCH CORRECTNESS, not merely
  // defensive: on touch devices a tap fires touchstart AND a synthesized
  // click, so interrupt() can be invoked twice per tap. The guard's
  // early-return is what makes that safe — do not remove as "redundant."
  // One-shot per pipeline; cleared in runPipeline's reset block.
  const interruptingRef = useRef(false);

  const viseme = useLipSync(audioRef, alignmentStoreRef);
  const wordState = useCurrentWord(audioRef, alignmentStoreRef);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    onVisemeChange?.(viseme);
  }, [viseme, onVisemeChange]);

  useEffect(() => {
    onWordStateChange?.(wordState);
    if (process.env.NODE_ENV !== "production") {
      console.log("[2a.5 word state]", {
        sentenceIndex: wordState.sentenceIndex,
        activeWordIndex: wordState.activeWordIndex,
      });
    }
  }, [wordState, onWordStateChange]);

  useEffect(() => {
    onMatchedAssetChange?.(matchedAsset);
  }, [matchedAsset, onMatchedAssetChange]);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ assets: Asset[] }>)
          : Promise.reject(new Error(`/api/assets ${r.status}`)),
      )
      .then(({ assets: data }) => {
        assetsRef.current = data;
      })
      .catch((err) => console.error("[VoiceLoop] asset fetch failed", err));
  }, []);

  const pumpAppendQueue = useCallback(() => {
    const sb = sourceBufferRef.current;
    if (!sb || sb.updating) return;
    const next = appendQueueRef.current.shift();
    if (next) sb.appendBuffer(next);
  }, []);

  const initMediaSource = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      const audio = audioRef.current!;
      const ms = new MediaSource();
      mediaSourceRef.current = ms;
      audio.src = URL.createObjectURL(ms);
      ms.addEventListener(
        "sourceopen",
        () => {
          try {
            const sb = ms.addSourceBuffer("audio/mpeg");
            sourceBufferRef.current = sb;
            sb.addEventListener("updateend", () => {
              pumpAppendQueue();
              if (
                finishedChatRef.current &&
                appendQueueRef.current.length === 0 &&
                !sb.updating &&
                ms.readyState === "open"
              ) {
                try {
                  ms.endOfStream();
                } catch {
                  /* already ended */
                }
              }
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        { once: true },
      );
    });
  }, [pumpAppendQueue]);

  const ttsChunk = useCallback(
    (text: string, sentenceIndex: number) => {
      ttsQueueRef.current = ttsQueueRef.current.then(async () => {
        // Read signal at fetch time, not at ttsChunk-call time —
        // chunks may be enqueued early but fetched later. If pipeline
        // was interrupted before this chunk's turn, signal carries the
        // aborted state and the fetch rejects immediately.
        const signal = pipelineAbortRef.current?.signal;
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`TTS failed: ${res.status}`);
        }

        const accumulated: AlignmentData = {
          characters: [],
          character_start_times_seconds: [],
          character_end_times_seconds: [],
        };

        const handleLine = (line: string) => {
          if (!line) return;
          const parsed = JSON.parse(line) as {
            audio_base64?: string;
            alignment?: AlignmentData | null;
          };
          if (parsed.audio_base64) {
            const binary = atob(parsed.audio_base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            appendQueueRef.current.push(bytes.buffer as ArrayBuffer);
            pumpAppendQueue();
          }
          if (parsed.alignment) {
            accumulated.characters.push(...parsed.alignment.characters);
            accumulated.character_start_times_seconds.push(
              ...parsed.alignment.character_start_times_seconds,
            );
            accumulated.character_end_times_seconds.push(
              ...parsed.alignment.character_end_times_seconds,
            );
          }
        };

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let lineBuffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          lineBuffer += decoder.decode(value, { stream: true });
          let nlIndex = lineBuffer.indexOf("\n");
          while (nlIndex !== -1) {
            const line = lineBuffer.slice(0, nlIndex).trim();
            lineBuffer = lineBuffer.slice(nlIndex + 1);
            handleLine(line);
            nlIndex = lineBuffer.indexOf("\n");
          }
        }
        // Server may close without a trailing newline — flush whatever remains.
        const tail = lineBuffer.trim();
        if (tail) handleLine(tail);

        const durationSec =
          accumulated.character_end_times_seconds[
            accumulated.character_end_times_seconds.length - 1
          ] ?? 0;
        const audioStartTime = cumulativeAudioDurationRef.current;
        const words = computeWordSegments(accumulated);
        alignmentStoreRef.current.push({ sentenceIndex, audioStartTime, alignment: accumulated, words });
        cumulativeAudioDurationRef.current += durationSec;

        if (process.env.NODE_ENV !== "production") {
          console.log("[2a.2 alignment]", {
            sentenceIndex,
            audioStartTime,
            charCount: accumulated.characters.length,
            durationSec,
            wordCount: words.length,
          });
        }
      });
      return ttsQueueRef.current;
    },
    [pumpAppendQueue],
  );

  const runPipeline = useCallback(
    async (audioBlob: Blob) => {
      finishedChatRef.current = false;
      appendQueueRef.current = [];
      ttsQueueRef.current = Promise.resolve();
      alignmentStoreRef.current = [];
      cumulativeAudioDurationRef.current = 0;
      interruptingRef.current = false;

      // Fresh AbortController per pipeline. signal is threaded into
      // every fetch (STT + chat + each TTS) so a single ac.abort() —
      // wired through interrupt() in 3.5.2 — cascades to all of them.
      const ac = new AbortController();
      pipelineAbortRef.current = ac;

      try {
        setStatus("thinking");

        // 1. STT
        const sttRes = await fetch("/api/stt", {
          method: "POST",
          headers: { "Content-Type": audioBlob.type || "audio/webm" },
          body: audioBlob,
          signal: ac.signal,
        });
        if (!sttRes.ok) throw new Error(`STT failed: ${sttRes.status}`);
        const { transcript: t } = (await sttRes.json()) as { transcript: string };
        if (!t.trim()) {
          setStatus("idle");
          return;
        }

        // 2. Init MediaSource for streaming TTS audio
        await initMediaSource();
        const audio = audioRef.current!;
        audio.play().catch(() => {
          /* will start once buffer fills */
        });

        // 3. Chat: stream text, chunk into sentences, fire TTS sequentially
        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: t, sessionId }),
          signal: ac.signal,
        });
        if (!chatRes.ok || !chatRes.body) throw new Error(`Chat failed: ${chatRes.status}`);

        setStatus("speaking");

        const reader = chatRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sentenceCounter = 0;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Flush completed sentences from buffer
          while (buffer.length >= MIN_CHUNK_CHARS) {
            const m = buffer.match(SENTENCE_END);
            if (!m || m.index === undefined) break;
            const cut = m.index + m[0].length;
            const sentence = buffer.slice(0, cut).trim();
            buffer = buffer.slice(cut);
            const { strippedText, events } = parseStageTags(sentence);
            for (const event of events) {
              switch (event.action) {
                case "show": {
                  const m = matchAssetByQuery(event.query, assetsRef.current);
                  setMatchedAsset(m);
                  break;
                }
                case "hide":
                  setMatchedAsset(null);
                  break;
              }
            }
            if (strippedText.trim()) ttsChunk(strippedText, sentenceCounter++).catch((e) => console.error("[VoiceLoop] TTS chunk failed", e));
          }
        }

        // Flush remaining buffer as final TTS chunk
        const tail = buffer.trim();
        const { strippedText: tailStripped, events: tailEvents } = parseStageTags(tail);
        for (const event of tailEvents) {
          switch (event.action) {
            case "show": {
              const m = matchAssetByQuery(event.query, assetsRef.current);
              setMatchedAsset(m);
              break;
            }
            case "hide":
              setMatchedAsset(null);
              break;
          }
        }
        if (tailStripped.trim()) ttsChunk(tailStripped, sentenceCounter++).catch((e) => console.error("[VoiceLoop] TTS chunk failed", e));

        // Wait for all TTS chunks to land in the buffer, then signal end of stream
        await ttsQueueRef.current;
        finishedChatRef.current = true;
        // Trigger updateend handler if buffer is currently idle
        const sb = sourceBufferRef.current;
        const ms = mediaSourceRef.current;
        if (sb && !sb.updating && ms && ms.readyState === "open") {
          try {
            ms.endOfStream();
          } catch {
            /* already ended */
          }
        }

        // Wait for playback to end before going idle.
        // Resolve fn is also stashed in audioEndResolveRef so the
        // future interrupt() (3.5.2) can unwedge this await when
        // audio.pause() is used to stop mid-playback — pause does
        // NOT fire "ended", so without the external handle this
        // Promise would hang forever and finally would never run.
        // On a normal turn, the "ended" event fires first and
        // resolves the Promise via onEnd; the manual resolve path
        // is unreachable in 3.5.1 (no caller).
        await new Promise<void>((resolve) => {
          const a = audioRef.current!;
          audioEndResolveRef.current = resolve;
          const onEnd = () => {
            a.removeEventListener("ended", onEnd);
            audioEndResolveRef.current = null;
            resolve();
          };
          a.addEventListener("ended", onEnd);
          // Safety net: if the audio is already done buffering and ended fired earlier
          if (a.ended) {
            audioEndResolveRef.current = null;
            resolve();
          }
        });
      } catch (e) {
        // AbortError is intentional (interrupt() in 3.5.2) — silent.
        // Anything else is a real pipeline failure.
        if (e instanceof DOMException && e.name === "AbortError") {
          // intentional interrupt
        } else {
          console.error("[VoiceLoop] pipeline failed", e);
        }
      } finally {
        pipelineAbortRef.current = null;
        audioEndResolveRef.current = null;
        setStatus("idle");
      }
    },
    // sessionId is intentionally omitted from deps. It only sources
    // from URL search params, and URL changes always trigger a full
    // page reload (which destroys and recreates this component).
    // If SPA navigation between sessions is ever added, this
    // suppression must be revisited.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initMediaSource, ttsChunk],
  );

  const startRecording = useCallback(async () => {
    if (status !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size > 0) runPipeline(blob);
        else setStatus("idle");
      };
      recorderRef.current = recorder;
      recorder.start();
      setStatus("listening");
    } catch (e) {
      console.error("[VoiceLoop] startRecording failed", e);
      setStatus("idle");
    }
  }, [runPipeline, status]);

  const stopRecording = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state === "recording") r.stop();
  }, []);

  // Phase 3.5 interrupt — tears down the in-flight pipeline cleanly so
  // status returns to idle and the next turn can start without wedge.
  // TEMPORARY trigger via the button's "Stop" affordance during
  // "speaking"; real trigger will be the future wake-word "Hey Mask
  // stop" on a separate phase. Teardown order proven race-safe at the
  // PLAN gate — see commit body of 3.5.1 (engine internals) for the
  // audio-end-await unwedge rationale and 3.5.2 (this commit) for the
  // step-by-step ordering justification.
  function interrupt() {
    if (interruptingRef.current) return;
    interruptingRef.current = true;

    // [1] Abort in-flight fetches — kicks off abort-reject unwind in
    //     parallel with the rest of this function.
    pipelineAbortRef.current?.abort();

    // [2] Pause audio — the user-perceptible stop. No-op if not playing.
    const audio = audioRef.current;
    try { audio?.pause(); } catch { /* play()/pause() race; ignore */ }

    // [3] Unwedge the audio-end await IF the pipeline cursor is sitting
    //     on it (ref is null in every other window). Without this,
    //     audio.pause() above leaves the line-355 Promise pending
    //     forever — finally never runs, status wedges on "speaking".
    audioEndResolveRef.current?.();

    // [4] Drain TTS queues. AbortController handles in-flight fetches;
    //     this is belt-and-suspenders so any callback enqueued before
    //     abort doesn't accumulate.
    ttsQueueRef.current = Promise.resolve();
    appendQueueRef.current = [];

    // [5] Tear down MediaSource. endOfStream() may have already fired
    //     in the audio-end-await window — wrap.
    const ms = mediaSourceRef.current;
    if (ms && ms.readyState === "open") {
      try { ms.endOfStream(); } catch { /* already ended or busy */ }
    }
    if (audio?.src) {
      const oldSrc = audio.src;
      audio.removeAttribute("src");
      try { URL.revokeObjectURL(oldSrc); } catch { /* not an object URL */ }
    }
    mediaSourceRef.current = null;
    sourceBufferRef.current = null;

    // [6] Reset pipeline-state refs — symmetric with runPipeline's
    //     reset block; ensures next turn starts on clean ground even
    //     if it starts before pipeline's finally has unwound.
    finishedChatRef.current = false;
    alignmentStoreRef.current = [];
    cumulativeAudioDurationRef.current = 0;

    // [7] Land in idle. Pipeline's finally also calls setStatus("idle")
    //     once awaits unwind — idempotent on same value, no flicker.
    setStatus("idle");
  }

  // Release mic if user navigates away while holding
  useEffect(() => {
    return () => {
      const r = recorderRef.current;
      if (r && r.state === "recording") r.stop();
    };
  }, []);

  const buttonDisabled = status === "thinking";
  const isStopMode = status === "speaking";
  const buttonLabel = isStopMode ? "Stop" : "Hold to speak";

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col-reverse items-center gap-3 px-4 pb-20">
      {/*
        Phase 3.5 TEMPORARY trigger — button doubles as Stop during
        "speaking" so we can interrupt Mask mid-speech. Real trigger
        is the future wake-word "Hey Mask stop" on a separate phase.
        When wake-word lands, this button can return to press-and-hold
        only and the buttonDisabled gate widens back to include
        "speaking".
      */}
      <button
        type="button"
        disabled={buttonDisabled}
        onMouseDown={isStopMode ? undefined : startRecording}
        onMouseUp={isStopMode ? undefined : stopRecording}
        onMouseLeave={isStopMode ? undefined : stopRecording}
        onClick={isStopMode ? interrupt : undefined}
        onTouchStart={(e) => {
          e.preventDefault();
          if (isStopMode) interrupt();
          else startRecording();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          if (!isStopMode) stopRecording();
        }}
        className="select-none rounded-full bg-black/40 px-6 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition hover:bg-black/55 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buttonLabel}
      </button>

      <WakeWord status={status} onWake={() => {}} />

      <audio ref={audioRef} autoPlay />
    </div>
  );
}
