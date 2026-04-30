import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPGRAM_API_KEY not set" }, { status: 500 });
  }

  const contentType = req.headers.get("content-type") || "audio/webm";
  const audio = await req.arrayBuffer();

  const params = new URLSearchParams({
    model: "nova-2",
    smart_format: "true",
    language: "multi",
    punctuate: "true",
  });

  const dg = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": contentType,
    },
    body: audio,
  });

  if (!dg.ok) {
    const text = await dg.text();
    return NextResponse.json(
      { error: "Deepgram error", status: dg.status, detail: text },
      { status: 502 },
    );
  }

  const data = await dg.json();
  const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

  return NextResponse.json({ transcript });
}
