import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UUID_REGEX } from "@/lib/uuid";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!UUID_REGEX.test(params.id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const { data: row, error: lookupErr } = await supabaseAdmin
      .from("assets")
      .select("storage_path")
      .eq("id", params.id)
      .single();

    if (lookupErr || !row) {
      return NextResponse.json({ error: "asset not found" }, { status: 404 });
    }

    if (row.storage_path) {
      const { error: rmErr } = await supabaseAdmin.storage
        .from("assets")
        .remove([row.storage_path]);

      if (rmErr) {
        console.error("[DELETE /api/admin/assets/[id]] storage remove failed:", rmErr);
        return NextResponse.json({ error: rmErr.message }, { status: 500 });
      }
    }

    const { error: delErr } = await supabaseAdmin
      .from("assets")
      .delete()
      .eq("id", params.id);

    if (delErr) {
      console.error("[DELETE /api/admin/assets/[id]] row delete failed:", delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/assets/[id]] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
