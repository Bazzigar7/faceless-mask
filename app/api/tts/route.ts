import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set" },
      { status: 500 },
    );
  }

  const { text } = (await req.json()) as { text?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    output_format: "mp3_44100_128",
    optimize_streaming_latency: "3",
  });

  // TEMP (Phase 3.2 latency measurement): TTFB = time from request start to
  // ElevenLabs response headers. Lands in Vercel function logs. REMOVE in the
  // 3.2 doc-sweep before this file re-locks.
  const ttsStart = performance.now();
  const eleven = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream/with-timestamps?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/x-ndjson",
      },
      body: JSON.stringify({
        text,
        // Turbo v2.5 — active TTS model on the paid (Starter) tier for lower latency; see README Known Reversals #2.
        model_id: "eleven_turbo_v2_5",
      }),
    },
  );
  // TEMP (Phase 3.2): see note above — remove in doc-sweep.
  console.log(`[Phase 3.2 TEMP] TTS TTFB: ${(performance.now() - ttsStart).toFixed(0)}ms`);

  if (!eleven.ok || !eleven.body) {
    const detail = await eleven.text().catch(() => "");
    return NextResponse.json(
      { error: "ElevenLabs error", status: eleven.status, detail },
      { status: 502 },
    );
  }

  return new Response(eleven.body, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
