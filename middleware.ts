// middleware.ts
// HTTP Basic Auth gate for /admin and /api/admin routes.
// Scoped via config.matcher below — every other route (voice loop,
// /api/chat, /api/stt, /api/tts, static assets) is unaffected.
// Single shared password (V1) sourced from ADMIN_PASSWORD env var.
// Fail-closed: missing env var → 401, never silently open.

import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest): NextResponse {
  const expected = process.env.ADMIN_PASSWORD;

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = safeAtob(header.slice("Basic ".length));
    if (decoded !== null) {
      // "user:pass" — username ignored, only password validated.
      const idx = decoded.indexOf(":");
      const pass = idx >= 0 ? decoded.slice(idx + 1) : decoded;
      if (expected && pass === expected) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Mask Admin"' },
  });
}

function safeAtob(s: string): string | null {
  try {
    return atob(s);
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
  ],
};
