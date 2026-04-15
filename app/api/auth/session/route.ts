import { NextRequest, NextResponse } from "next/server";
import { isLoggedIn, getSessionForClient } from "@/lib/zalo";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value;
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const session = getSessionForClient(sid);
  if (!session) {
    return NextResponse.json({ error: "Session unavailable" }, { status: 503 });
  }
  return NextResponse.json(session);
}
