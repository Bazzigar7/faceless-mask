import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MASK_SYSTEM_PROMPT } from "@/lib/personality";

export const runtime = "nodejs";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { transcript } = (await req.json()) as { transcript?: string };
  if (!transcript || !transcript.trim()) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: MASK_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: transcript }],
  });

  // Log cache hit metrics in dev once the stream completes
  stream
    .finalMessage()
    .then((msg) => {
      const u = msg.usage;
      console.log(
        `[chat] cache_read=${u.cache_read_input_tokens ?? 0} cache_create=${u.cache_creation_input_tokens ?? 0} input=${u.input_tokens} output=${u.output_tokens}`,
      );
    })
    .catch(() => {});

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
