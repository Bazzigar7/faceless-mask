import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createAsset } from "@/lib/createAsset";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type?: unknown;
      storage_path?: unknown;
      tags?: unknown;
      exact_phrases?: unknown;
      alt_text?: unknown;
      description?: unknown;
    };

    if (body.type !== "image" && body.type !== "video") {
      return NextResponse.json(
        { error: "type must be 'image' or 'video'" },
        { status: 400 },
      );
    }

    if (typeof body.storage_path !== "string" || body.storage_path.trim() === "") {
      return NextResponse.json(
        { error: "storage_path is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(body.tags) ||
      !body.tags.every((t) => typeof t === "string")
    ) {
      return NextResponse.json(
        { error: "tags must be a string array" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(body.exact_phrases) ||
      !body.exact_phrases.every((p) => typeof p === "string")
    ) {
      return NextResponse.json(
        { error: "exact_phrases must be a string array" },
        { status: 400 },
      );
    }

    const storage_path = body.storage_path.trim();
    const { data: pub } = supabaseAdmin.storage.from("assets").getPublicUrl(storage_path);
    const url = pub.publicUrl;

    const alt_text =
      typeof body.alt_text === "string" && body.alt_text.trim() !== ""
        ? body.alt_text.trim()
        : null;

    const description =
      typeof body.description === "string" && body.description.trim() !== ""
        ? body.description.trim()
        : null;

    const id = await createAsset({
      type: body.type,
      storage_path,
      url,
      tags: body.tags as string[],
      exact_phrases: body.exact_phrases as string[],
      alt_text,
      description,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/assets] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
