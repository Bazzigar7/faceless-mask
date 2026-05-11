import { NextRequest, NextResponse } from "next/server";
import { updateSession, type UpdateSessionInput } from "@/lib/updateSession";
import { validateBrief } from "@/lib/banks/validateBrief";
import { validateSummary } from "@/lib/validateSummary";
import { UUID_REGEX } from "@/lib/uuid";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!UUID_REGEX.test(params.id)) {
    return NextResponse.json(
      { error: "id must be a valid UUID" },
      { status: 400 },
    );
  }

  try {
    const body = (await req.json()) as Partial<UpdateSessionInput>;

    if (!body.topic || !body.date) {
      return NextResponse.json(
        { error: "topic and date are required" },
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

    const summaryValidation = validateSummary(body.summary ?? null);
    if (!summaryValidation.ok) {
      return NextResponse.json(
        {
          error: "Summary validation failed",
          details: summaryValidation.errors,
        },
        { status: 400 },
      );
    }

    await updateSession(params.id, {
      sessionNumber: body.sessionNumber ?? null,
      topic: body.topic,
      date: body.date,
      brief: briefValidation.brief,
      summary: summaryValidation.summary,
    });

    return NextResponse.json({ id: params.id });
  } catch (err) {
    console.error("[PUT /api/admin/sessions/[id]] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
