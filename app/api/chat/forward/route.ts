import { NextResponse } from "next/server";
import { ThreadType } from "zca-js";
import { isLoggedIn, getZaloApi } from "@/lib/zalo";

export async function POST(req: Request) {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const api = getZaloApi();
  if (!api) {
    return NextResponse.json({ error: "API not available" }, { status: 503 });
  }

  const body = await req.json();
  const { messageContent, messageId, messageTs, targetThreadId, targetThreadType } = body ?? {};

  if (!messageContent || !targetThreadId) {
    return NextResponse.json({ error: "messageContent and targetThreadId are required" }, { status: 400 });
  }

  const type = targetThreadType === "Group" ? ThreadType.Group : ThreadType.User;

  const result = await api.forwardMessage(
    {
      message: String(messageContent),
      reference: {
        id: String(messageId ?? ""),
        ts: Number(messageTs ?? 0),
        logSrcType: 0,
        fwLvl: 0,
      },
    },
    [String(targetThreadId)],
    type
  );

  if (result.success.length === 0) {
    return NextResponse.json({ error: "Forward failed", fail: result.fail }, { status: 422 });
  }

  return NextResponse.json({ success: result.success });
}
