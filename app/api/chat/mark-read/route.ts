import { NextRequest, NextResponse } from "next/server";
import { isLoggedIn } from "@/lib/zalo";
import { markRead } from "@/lib/messageStore";

export async function POST(req: NextRequest) {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  let body: { threadId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.threadId) {
    return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
  }

  markRead(body.threadId);
  return NextResponse.json({ ok: true });
}
