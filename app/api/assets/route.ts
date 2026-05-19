import { NextResponse } from "next/server";
import { listAssets } from "@/lib/listAssets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const assets = await listAssets();
    return NextResponse.json({ assets });
  } catch (err) {
    console.error("[GET /api/assets] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
