import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";

export const runtime = "nodejs";

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  const contentType = req.headers.get("content-type") || "audio/webm";
  // Map MIME to a filename Whisper recognizes (it sniffs the extension).
  const ext = contentType.includes("mp4")
    ? "mp4"
    : contentType.includes("mpeg")
      ? "mp3"
      : contentType.includes("wav")
        ? "wav"
        : contentType.includes("ogg")
          ? "ogg"
          : "webm";

  const audio = await req.arrayBuffer();
  const file = await toFile(Buffer.from(audio), `audio.${ext}`, { type: contentType });

  try {
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });
    return NextResponse.json({ transcript: transcription.text ?? "" });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Whisper error", detail },
      { status: 502 },
    );
  }
}
