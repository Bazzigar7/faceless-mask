"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Status } from "./StatusIndicator";

// Phase 3.7 — Wake word V1: hands-free activation.
// Listens for "hey mask" on the browser-native Web Speech API
// (Chrome-only for V1 — deliberate; cross-browser/on-device is V2).
// On detection it console.logs AND calls onWake to start the real voice
// pipeline hands-free (micro-step 2). onWake is wired to startRecording in
// VoiceLoop; its own status==="idle" guard makes a stray wake a safe no-op.
interface WakeWordProps {
  status: Status;
  onWake?: () => void;
}

const WAKE_PHRASE = "hey mask";

// Self-healing re-arm tunables. A transient Chrome InvalidStateError on
// recognition.start() (common right after a turn's abort/teardown) used to be
// swallowed with no retry, permanently killing the wake word after one turn.
// Now a failed start schedules a backed-off retry until it succeeds.
const BASE_BACKOFF_MS = 150;
const MAX_BACKOFF_MS = 1000;
// After this many consecutive failed restarts, surface a one-time warning —
// the recognizer is likely genuinely dead (mic permission revoked / device
// gone). We keep retrying (no hard-stop), but the failure is now VISIBLE
// instead of silent. The original bug was invisible; this must not be.
const MAX_CONSECUTIVE_FAILURES = 5;

export default function WakeWord({ status, onWake }: WakeWordProps) {
  const [armed, setArmed] = useState(false);

  // Long-lived recognition callbacks (onend/onresult) close over their
  // creation-time scope, so read live values through refs to avoid staleness.
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const armedRef = useRef(false);
  const statusRef = useRef<Status>(status);

  // Self-healing re-arm bookkeeping.
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(BASE_BACKOFF_MS);
  // True between a non-throwing start() and the matching onend. Set
  // OPTIMISTICALLY right after start() (not only in onstart), because start()
  // is async — onstart fires later, and a retry timer firing in that gap would
  // otherwise call start() again and throw. onstart re-affirms it; onend clears it.
  const runningRef = useRef(false);
  const failureCountRef = useRef(0);
  const stuckWarnedRef = useRef(false);
  // Holds the stable tryStart so the backoff setTimeout can self-schedule
  // without a self-referential dependency on the callback.
  const tryStartRef = useRef<() => void>(() => {});

  // Keep the status ref current for the onend restart guard.
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  // Single self-healing entry point for (re)starting recognition — replaces
  // every bare recognition.start(). On a thrown InvalidStateError it schedules
  // a backed-off retry instead of dying silently. Reads everything through refs
  // so it stays a stable, dependency-light callback.
  const tryStart = useCallback(() => {
    // Only re-arm when we should actually be listening.
    if (!armedRef.current || statusRef.current !== "idle") return;
    // Already live (or inside the async start()->onstart window): never call
    // start() twice — that re-entrant call is itself the throw we're avoiding.
    if (runningRef.current) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.start();
      // Optimistic guard closes the start()->onstart race (see runningRef).
      runningRef.current = true;
      // Request accepted — reset the heal counters.
      failureCountRef.current = 0;
      backoffRef.current = BASE_BACKOFF_MS;
      stuckWarnedRef.current = false;
    } catch {
      // Transient bad state (recognizer mid-teardown after a turn, etc.).
      // Self-heal: schedule a backed-off retry rather than swallow-and-die.
      failureCountRef.current += 1;
      if (
        failureCountRef.current >= MAX_CONSECUTIVE_FAILURES &&
        !stuckWarnedRef.current
      ) {
        stuckWarnedRef.current = true;
        console.warn(
          `[WakeWord] restart has failed ${failureCountRef.current}x — recognizer may be stuck (mic permission revoked or device gone?). Still retrying.`,
        );
      }
      clearRestartTimer();
      restartTimerRef.current = setTimeout(
        () => tryStartRef.current(),
        backoffRef.current,
      );
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
    }
  }, [clearRestartTimer]);

  // Point the ref at the stable tryStart so the backoff setTimeout above can
  // self-schedule without listing tryStart in its own dependency array.
  useEffect(() => {
    tryStartRef.current = tryStart;
  }, [tryStart]);

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
          onWake?.();
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log(`[WakeWord] recognition error: ${event.error}`);
      // A session is ending — clear the running guard so re-arm isn't blocked.
      // Chrome does NOT reliably fire onend after onerror (esp. no-speech), so
      // we cannot rely on onend alone to reset this — that was the wedge that
      // left the wake word deaf after idle silence / an interrupt.
      runningRef.current = false;
      // Terminal permission errors can't be recovered by retrying — warn + stop
      // rather than loop forever on a denial.
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        console.warn(
          `[WakeWord] mic blocked (${event.error}) — wake word stopping until page reload.`,
        );
        return;
      }
      // Transient error (no-speech / aborted / network / audio-capture): re-arm,
      // coalesced with onend through the shared timer so at most one start()
      // fires if both events land.
      if (armedRef.current && statusRef.current === "idle") {
        clearRestartTimer();
        restartTimerRef.current = setTimeout(
          () => tryStartRef.current(),
          BASE_BACKOFF_MS,
        );
      }
    };

    // A session actually began — re-affirm the running guard and clear any
    // pending retry / heal counters.
    recognition.onstart = () => {
      runningRef.current = true;
      failureCountRef.current = 0;
      backoffRef.current = BASE_BACKOFF_MS;
      stuckWarnedRef.current = false;
      clearRestartTimer();
    };

    // Chrome ends continuous recognition periodically (~every minute), and a
    // session can also end via error. Either way the session is over: clear
    // the running guard, then re-arm through the self-healing path — but ONLY
    // while armed and idle, so we never listen over Mask's own turn.
    recognition.onend = () => {
      runningRef.current = false;
      // Re-arm through the shared timer — coalesces with onerror: if both fire,
      // the second clearRestartTimer() cancels the first's pending timer, so
      // exactly one tryStart runs (no double-start).
      if (armedRef.current && statusRef.current === "idle") {
        clearRestartTimer();
        restartTimerRef.current = setTimeout(
          () => tryStartRef.current(),
          BASE_BACKOFF_MS,
        );
      }
    };

    recognitionRef.current = recognition;
    armedRef.current = true;
    setArmed(true);

    tryStart();
  }, [tryStart, clearRestartTimer]);

  // Status gate: recognition runs ONLY when status === "idle". When the
  // pipeline takes over (listening/thinking/speaking) we abort; onend's
  // guard then suppresses the restart until we land back on idle, and this
  // same effect restarts it.
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition || !armed) return;

    if (status === "idle") {
      tryStart();
    } else {
      // Leaving idle: cancel any pending self-heal retry so it can't fire a
      // start() over Mask's turn, then hand the mic off.
      clearRestartTimer();
      recognition.abort();
    }
  }, [status, armed, tryStart, clearRestartTimer]);

  // Stop listening and detach handlers on unmount.
  useEffect(() => {
    return () => {
      armedRef.current = false;
      clearRestartTimer();
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.onstart = null;
        recognition.abort();
      }
    };
  }, [clearRestartTimer]);

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
