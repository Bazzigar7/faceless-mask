import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MASK_SYSTEM_PROMPT } from "@/lib/personality";
import { loadSessionContext, type SessionContext } from "@/lib/sessionContext";
import { formatSessionContext } from "@/lib/formatSessionContext";

export const runtime = "nodejs";

const client = new Anthropic();

// Wraps the strict loader with graceful degrade. Voice continuity
// is the route's primary job — losing personalization beats losing voice.
async function loadSessionContextSafe(
  sessionId: string,
): Promise<SessionContext | null> {
  try {
    return await loadSessionContext(sessionId);
  } catch (err) {
    console.error('[chat] Session context load failed, degrading to no-context:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { transcript, sessionId } = (await req.json()) as { transcript: string; sessionId?: string };
  if (!transcript || !transcript.trim()) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  // Empty string treated same as undefined — defense in depth
  // before the loader's own UUID regex check.
  const sessionContext = sessionId && sessionId.trim()
    ? await loadSessionContextSafe(sessionId)
    : null;
  console.log('[chat] sessionContext:',
    !sessionId ? 'no sessionId in body' :
    sessionContext ? `loaded for session ${sessionId}` :
    `loader returned null for ${sessionId}`
  );

  const systemBlocks: Array<{
    type: "text";
    text: string;
    cache_control: { type: "ephemeral" };
  }> = [
    {
      type: "text",
      text: MASK_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
  ];

  if (sessionContext) {
    systemBlocks.push({
      type: "text",
      text: formatSessionContext(sessionContext),
      cache_control: { type: "ephemeral" },
    });
  }

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemBlocks,
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
