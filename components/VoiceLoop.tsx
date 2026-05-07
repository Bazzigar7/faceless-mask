"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AlignmentData, SentenceAlignment, Viseme } from "@/lib/types";
import { type Status } from "./StatusIndicator";

const MIN_CHUNK_CHARS = 40;
const SENTENCE_END = /[.!?]\s/;

export default function VoiceLoop({
  onStatusChange,
  onVisemeChange,
}: {
  onStatusChange?: (status: Status) => void;
  onVisemeChange?: (viseme: Viseme) => void;
} = {}) {
  const [status, setStatus] = useState<Status>("idle");
  const [viseme, setViseme] = useState<Viseme>("rest");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    onVisemeChange?.(viseme);
  }, [viseme, onVisemeChange]);

  useEffect(() => {
    if (status !== "speaking") return;
    const cycle: Viseme[] = ["closed", "open-a", "open-e", "open-o", "rest"];
    let i = 1;
    setViseme(cycle[0]);
    const id = setInterval(() => {
      setViseme(cycle[i % cycle.length]);
      i++;
    }, 200);
    return () => {
      clearInterval(id);
      setViseme("rest");
    };
  }, [status]);

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
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
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
        alignmentStoreRef.current.push({ sentenceIndex, audioStartTime, alignment: accumulated });
        cumulativeAudioDurationRef.current += durationSec;

        if (process.env.NODE_ENV !== "production") {
          console.log("[2a.2 alignment]", {
            sentenceIndex,
            audioStartTime,
            charCount: accumulated.characters.length,
            durationSec,
          });
        }
      });
      return ttsQueueRef.current;
    },
    [pumpAppendQueue],
  );

  const runPipeline = useCallback(
    async (audioBlob: Blob) => {
      setError(null);
      setTranscript("");
      setReply("");
      finishedChatRef.current = false;
      appendQueueRef.current = [];
      ttsQueueRef.current = Promise.resolve();
      alignmentStoreRef.current = [];
      cumulativeAudioDurationRef.current = 0;

      try {
        setStatus("thinking");

        // 1. STT
        const sttRes = await fetch("/api/stt", {
          method: "POST",
          headers: { "Content-Type": audioBlob.type || "audio/webm" },
          body: audioBlob,
        });
        if (!sttRes.ok) throw new Error(`STT failed: ${sttRes.status}`);
        const { transcript: t } = (await sttRes.json()) as { transcript: string };
        setTranscript(t);
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
          body: JSON.stringify({ transcript: t }),
        });
        if (!chatRes.ok || !chatRes.body) throw new Error(`Chat failed: ${chatRes.status}`);

        setStatus("speaking");

        const reader = chatRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullReply = "";
        let sentenceCounter = 0;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          fullReply += chunk;
          setReply(fullReply);

          // Flush completed sentences from buffer
          while (buffer.length >= MIN_CHUNK_CHARS) {
            const m = buffer.match(SENTENCE_END);
            if (!m || m.index === undefined) break;
            const cut = m.index + m[0].length;
            const sentence = buffer.slice(0, cut).trim();
            buffer = buffer.slice(cut);
            if (sentence) ttsChunk(sentence, sentenceCounter++).catch((e) => setError(String(e)));
          }
        }

        // Flush remaining buffer as final TTS chunk
        const tail = buffer.trim();
        if (tail) ttsChunk(tail, sentenceCounter++).catch((e) => setError(String(e)));

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

        // Wait for playback to end before going idle
        await new Promise<void>((resolve) => {
          const a = audioRef.current!;
          const onEnd = () => {
            a.removeEventListener("ended", onEnd);
            resolve();
          };
          a.addEventListener("ended", onEnd);
          // Safety net: if the audio is already done buffering and ended fired earlier
          if (a.ended) resolve();
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setStatus("idle");
      }
    },
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
      setError(e instanceof Error ? e.message : String(e));
      setStatus("idle");
    }
  }, [runPipeline, status]);

  const stopRecording = useCallback(() => {
    const r = recorderRef.current;
    if (r && r.state === "recording") r.stop();
  }, []);

  // Release mic if user navigates away while holding
  useEffect(() => {
    return () => {
      const r = recorderRef.current;
      if (r && r.state === "recording") r.stop();
    };
  }, []);

  const buttonDisabled = status === "thinking" || status === "speaking";

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col-reverse items-center gap-3 px-4 pb-20">
      <button
        type="button"
        disabled={buttonDisabled}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={(e) => {
          e.preventDefault();
          startRecording();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopRecording();
        }}
        className="select-none rounded-full bg-black/40 px-6 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition hover:bg-black/55 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Hold to speak
      </button>

      <audio ref={audioRef} autoPlay />

      <div className="hidden">
        {transcript && (
          <div className="w-full max-w-xl rounded-md bg-zinc-900/60 p-3 text-sm text-zinc-300">
            <div className="text-xs uppercase tracking-wide text-zinc-500">You</div>
            <div>{transcript}</div>
          </div>
        )}
        {reply && (
          <div className="w-full max-w-xl rounded-md bg-zinc-900/60 p-3 text-sm text-zinc-100">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Mask</div>
            <div>{reply}</div>
          </div>
        )}
        {error && (
          <div className="w-full max-w-xl rounded-md bg-red-950/60 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
