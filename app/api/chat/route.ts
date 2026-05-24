import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MASK_SYSTEM_PROMPT } from "@/lib/personality";
import { loadSessionContext, type SessionContext } from "@/lib/sessionContext";
import { formatSessionContext } from "@/lib/formatSessionContext";
import { writeTurn } from "@/lib/writeTurn";
import { loadRecentTurns, HISTORY_TURN_LIMIT } from "@/lib/loadRecentTurns";

export const runtime = "nodejs";
export const maxDuration = 60;

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

/**
 * Graceful-degrade wrapper around writeTurn. Logs and continues
 * on failure — voice continuity beats persistence. Real errors
 * surface in Vercel logs via the [chat] writeTurn failed prefix.
 */
async function writeTurnSafe(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  try {
    await writeTurn(sessionId, role, content);
  } catch (err) {
    console.error('[chat] writeTurn failed (continuing):', err);
  }
}

/**
 * Graceful-degrade wrapper around loadRecentTurns. Returns [] on
 * failure — voice continuity beats history fidelity. Mirrors the
 * loadSessionContextSafe + writeTurnSafe pattern in this file.
 */
async function loadRecentTurnsSafe(
  sessionId: string,
  limit: number,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    return await loadRecentTurns(sessionId, limit);
  } catch (err) {
    console.error('[chat] loadRecentTurns failed (continuing with empty history):', err);
    return [];
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

  // Load PRIOR turns before writing the current user turn — otherwise the
  // SELECT picks up the just-written transcript and it appears twice.
  const history = sessionId
    ? await loadRecentTurnsSafe(sessionId, HISTORY_TURN_LIMIT)
    : [];

  if (sessionId) {
    await writeTurnSafe(sessionId, 'user', transcript);
  }

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
    messages: [...history, { role: "user", content: transcript }],
  });

  // Flipped true on the first text_delta forwarded to the browser
  // (in the ReadableStream below). Read by the .catch handler so the
  // [interrupted] marker is only written when Mask actually started
  // speaking — a bare API failure before any token streamed leaves
  // history with a user turn and no assistant follow-up (honest).
  let streamedAnyText = false;

  // Log cache hit metrics in dev once the stream completes
  stream
    .finalMessage()
    .then((msg) => {
      const u = msg.usage;
      console.log(
        `[chat] cache_read=${u.cache_read_input_tokens ?? 0} cache_create=${u.cache_creation_input_tokens ?? 0} input=${u.input_tokens} output=${u.output_tokens}`,
      );

      if (sessionId) {
        const assistantText = msg.content
          .map(block => block.type === 'text' ? block.text : '')
          .join('');
        return writeTurnSafe(sessionId, 'assistant', assistantText);
      }
    })
    .catch(() => {
      if (sessionId && streamedAnyText) {
        return writeTurnSafe(sessionId, 'assistant', '[interrupted]');
      }
    });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            streamedAnyText = true;
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
