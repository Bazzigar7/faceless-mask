import { NextRequest, NextResponse } from "next/server";
import { createSession, type CreateSessionInput } from "@/lib/createSession";
import { validateBrief } from "@/lib/banks/validateBrief";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateSessionInput>;

    if (!body.trackId || !body.topic || !body.date) {
      return NextResponse.json(
        { error: "trackId, topic, and date are required" },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(body.trackId)) {
      return NextResponse.json(
        { error: "trackId must be a valid UUID" },
        { status: 400 },
      );
    }

    const briefValidation = validateBrief(body.brief ?? null);
    if (!briefValidation.ok) {
      return NextResponse.json(
        {
          error: "Brief validation failed",
          details: briefValidation.errors,
        },
        { status: 400 },
      );
    }

    const id = await createSession({
      trackId: body.trackId,
      sessionNumber: body.sessionNumber ?? null,
      topic: body.topic,
      date: body.date,
      brief: briefValidation.brief,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/sessions] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
