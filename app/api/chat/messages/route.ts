import { NextRequest, NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/zalo";
import { getMessages } from "@/lib/messageStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  if (!threadId) {
    return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
  }

  const messages = getMessages(threadId, sid);
  return NextResponse.json({ messages });
}
