// Phase 3.7 — silence-based end-of-speech detection for hands-free turns.
// Taps a live mic MediaStream with a Web Audio AnalyserNode and fires
// onSilence once the speaker has clearly finished: it waits until speech is
// detected at least once (the speech-started latch), then fires after a
// sustained sub-threshold window. Generic by design — the policy values
// (threshold / silenceMs) and the hard max-duration ceiling live in the
// caller (components/VoiceLoop.tsx). Chrome-only V1.

export interface SilenceDetectorOptions {
  // Normalized RMS amplitude in [0..1]; a frame at or above this is "speech".
  threshold: number;
  // Sustained sub-threshold duration (ms) AFTER speech started → fire.
  silenceMs: number;
  // Called exactly once when end-of-speech is detected.
  onSilence: () => void;
}

// Starts analysing `stream` and returns an idempotent teardown function.
// Teardown is also safe to call after onSilence has already fired.
export function startSilenceDetection(
  stream: MediaStream,
  { threshold, silenceMs, onSilence }: SilenceDetectorOptions,
): () => void {
  const ctx = new AudioContext();
  // The context is created on the wake (voice) path, not a direct user
  // gesture, so it may start suspended under the autoplay policy. The
  // session already had a gesture (the "Arm wake word" click), so resume()
  // succeeds; if it somehow doesn't, the caller's max-duration ceiling is
  // the backstop that still ends the turn.
  void ctx.resume().catch(() => {});

  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  // Analyser only — never connect to ctx.destination, or the mic would
  // feed back to the speakers.
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);

  let speechStarted = false;
  let silenceStart: number | null = null;
  let fired = false;
  let rafId = 0;
  let torn = false;

  const tick = () => {
    analyser.getByteTimeDomainData(data);

    // RMS of the centered, normalized waveform.
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sumSquares += v * v;
    }
    const rms = Math.sqrt(sumSquares / data.length);

    if (rms >= threshold) {
      // Speech (or noise above the gate): arm the latch, reset any
      // pending silence window.
      speechStarted = true;
      silenceStart = null;
    } else if (speechStarted) {
      // Sub-threshold, but only counts once the speaker has begun.
      const now = performance.now();
      if (silenceStart === null) {
        silenceStart = now;
      } else if (now - silenceStart >= silenceMs && !fired) {
        fired = true;
        onSilence();
        return; // stop the loop; teardown will be invoked via onstop
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (torn) return;
    torn = true;
    cancelAnimationFrame(rafId);
    try {
      source.disconnect();
    } catch {
      /* already disconnected */
    }
    void ctx.close().catch(() => {});
  };
}
