import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

  const eleven = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?${params.toString()}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        // Free tier doesn't allow turbo v2.5. Switch back to eleven_turbo_v2_5 once on Starter plan ($5/mo) for lower latency.
        model_id: "eleven_multilingual_v2",
      }),
    },
  );

  if (!eleven.ok || !eleven.body) {
    const detail = await eleven.text().catch(() => "");
    return NextResponse.json(
      { error: "ElevenLabs error", status: eleven.status, detail },
      { status: 502 },
    );
  }

  return new Response(eleven.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
