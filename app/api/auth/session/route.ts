import { NextResponse } from "next/server";
import { isLoggedIn, getSessionForClient } from "@/lib/zalo";

export async function GET() {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  const session = getSessionForClient();
  if (!session) {
    return NextResponse.json({ error: "Session unavailable" }, { status: 503 });
  }
  return NextResponse.json(session);
}
