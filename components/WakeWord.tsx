"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Status } from "./StatusIndicator";

// Phase 3.7 — Wake word V1 (micro-step 1 of 2): DETECTION-ONLY.
// Listens for "hey mask" on the browser-native Web Speech API
// (Chrome-only for V1 — deliberate; cross-browser/on-device is V2).
// On detection it console.logs ONLY. It does NOT trigger the pipeline:
// onWake is declared on the props for the next micro-step but is left
// unwired here so this step's behavior is unambiguous.
interface WakeWordProps {
  status: Status;
  // Wired in micro-step 2 — intentionally not destructured/referenced yet.
  onWake?: () => void;
}

const WAKE_PHRASE = "hey mask";

export default function WakeWord({ status }: WakeWordProps) {
  const [armed, setArmed] = useState(false);

  // Long-lived recognition callbacks (onend/onresult) close over their
  // creation-time scope, so read live values through refs to avoid staleness.
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const armedRef = useRef(false);
  const statusRef = useRef<Status>(status);

  // Keep the status ref current for the onend restart guard.
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const arm = useCallback(() => {
    if (armedRef.current) return;

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      console.log("[WakeWord] Web Speech API unsupported in this browser");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Match on FINAL results only: interim transcripts mutate token by
      // token and would fire repeatedly within one utterance. isFinal gives
      // one stable, deduplicated detection per spoken phrase.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const transcript = result[0].transcript.toLowerCase();
        if (transcript.includes(WAKE_PHRASE)) {
          console.log("[WakeWord] detected: hey mask");
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log(`[WakeWord] recognition error: ${event.error}`);
    };

    // Chrome ends continuous recognition periodically (~every minute). Keep
    // it alive by restarting — but ONLY while armed and idle, so we never
    // listen over Mask's own turn.
    recognition.onend = () => {
      if (armedRef.current && statusRef.current === "idle") {
        try {
          recognition.start();
        } catch {
          // start() throws if already running — safe to ignore.
        }
      }
    };

    recognitionRef.current = recognition;
    armedRef.current = true;
    setArmed(true);

    if (statusRef.current === "idle") {
      try {
        recognition.start();
      } catch {
        // Ignore double-start.
      }
    }
  }, []);

  // Status gate: recognition runs ONLY when status === "idle". When the
  // pipeline takes over (listening/thinking/speaking) we abort; onend's
  // guard then suppresses the restart until we land back on idle, and this
  // same effect restarts it.
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !armed) return;

    if (status === "idle") {
      try {
        recognition.start();
      } catch {
        // Already running.
      }
    } else {
      recognition.abort();
    }
  }, [status, armed]);

  // Stop listening and detach handlers on unmount.
  useEffect(() => {
    return () => {
      armedRef.current = false;
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={arm}
      disabled={armed}
      className="select-none rounded-full bg-black/30 px-4 py-1.5 text-xs font-medium text-white/80 shadow backdrop-blur-sm transition hover:bg-black/45 active:scale-95 disabled:cursor-default disabled:opacity-60"
    >
      {armed ? "Wake word armed" : "Arm wake word"}
    </button>
  );
}
