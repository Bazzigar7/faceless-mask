import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
]);

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { filename?: unknown; contentType?: unknown };

    if (typeof body.filename !== "string" || body.filename.trim() === "") {
      return NextResponse.json(
        { error: "filename is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    if (
      typeof body.contentType !== "string" ||
      !ALLOWED_CONTENT_TYPES.has(body.contentType)
    ) {
      return NextResponse.json(
        {
          error: `contentType must be one of: ${[...ALLOWED_CONTENT_TYPES].join(", ")}`,
        },
        { status: 400 },
      );
    }

    const sanitized = sanitizeFilename(body.filename.trim());
    const path = `${crypto.randomUUID()}-${sanitized}`;

    const { data, error } = await supabaseAdmin.storage
      .from("assets")
      .createSignedUploadUrl(path);

    if (error) {
      console.error("[POST /api/admin/assets/sign] createSignedUploadUrl failed:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    });
  } catch (err) {
    console.error("[POST /api/admin/assets/sign] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
