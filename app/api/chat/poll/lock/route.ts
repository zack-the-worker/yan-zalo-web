import { NextRequest, NextResponse } from "next/server";
import { isLoggedIn, getZaloApi } from "@/lib/zalo";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const api = getZaloApi(sid);
  if (!api) {
    return NextResponse.json({ error: "API not available" }, { status: 503 });
  }

  const body = await req.json();
  const { pollId } = body ?? {};

  if (!pollId && pollId !== 0) {
    return NextResponse.json({ error: "pollId is required" }, { status: 400 });
  }

  await api.lockPoll(Number(pollId));
  return NextResponse.json({ success: true });
}
