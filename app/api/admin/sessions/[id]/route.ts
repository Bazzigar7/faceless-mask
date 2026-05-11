import { NextRequest, NextResponse } from "next/server";
import { updateSession, type UpdateSessionInput } from "@/lib/updateSession";
import { validateBrief } from "@/lib/banks/validateBrief";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

    await updateSession(params.id, {
      sessionNumber: body.sessionNumber ?? null,
      topic: body.topic,
      date: body.date,
      // Cast to the still-permissive public type — UpdateSessionInput.brief
      // tightens to SessionBrief | null in 5.2.1's type-ripple work.
      brief: briefValidation.brief as Record<string, unknown> | null,
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
