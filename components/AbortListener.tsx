"use client";

import { useEffect, useRef, useState } from "react";
import { type Status } from "./StatusIndicator";

// Phase 3.5.3.1 — Spoken-interrupt detection probe (step 1 of 2).
// Mirror of components/WakeWord.tsx, gated on status === "speaking" instead
// of "idle": listens for "mask abort" while Mask is talking and logs on a
// final-result match. DETECTION ONLY — no interrupt() call, no pipeline
// touch. Proves on real hardware that the recognizer can hear the human
// over Mask's own audio before step 2 wires the interrupt + canned line
// onto the byte-locked pipeline. Chrome-only V1 (Web Speech API).
interface AbortListenerProps {
  status: Status;
}

const ABORT_PHRASE = "mask abort";

export default function AbortListener({ status }: AbortListenerProps) {
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

  // Self-arm on mount: a "speaking" window is always preceded by a user
  // gesture (the talk button or wake word) and mic permission is already
  // granted by the recording path, so the probe needs no separate arm
  // button. Mirrors WakeWord's arm() body, minus the click entry point.
  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      console.log("[AbortListener] Web Speech API unsupported in this browser");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Match on FINAL results only (mirror of WakeWord): interim
      // transcripts mutate token by token and would fire repeatedly within
      // one utterance. isFinal gives one stable detection per spoken phrase.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const transcript = result[0].transcript.toLowerCase();
        if (transcript.includes(ABORT_PHRASE)) {
          console.log("[Phase 3.5.3 PROBE] heard 'mask abort'");
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log(`[AbortListener] recognition error: ${event.error}`);
    };

    // Chrome ends continuous recognition periodically (~every minute). Keep
    // it alive by restarting — but ONLY while armed and speaking, so we
    // never listen over the idle window (that's WakeWord's territory).
    recognition.onend = () => {
      if (armedRef.current && statusRef.current === "speaking") {
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

    if (statusRef.current === "speaking") {
      try {
        recognition.start();
      } catch {
        // Ignore double-start.
      }
    }

    // Stop listening and detach handlers on unmount.
    return () => {
      armedRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    };
  }, []);

  // Status gate: recognition runs ONLY when status === "speaking". The
  // mirror of WakeWord's idle gate. When the pipeline leaves speaking we
  // abort; onend's guard then suppresses the restart until we land back on
  // speaking, and this same effect restarts it.
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !armed) return;

    if (status === "speaking") {
      try {
        recognition.start();
      } catch {
        // Already running.
      }
    } else {
      recognition.abort();
    }
  }, [status, armed]);

  // Detection-only probe — renders no UI.
  return null;
}
