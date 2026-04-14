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
  const { icon, messageId, cliMsgId, threadId, threadType } = body ?? {};

  if (!icon || !messageId || !threadId) {
    return NextResponse.json({ error: "icon, messageId and threadId are required" }, { status: 400 });
  }

  const type = threadType === "Group" ? ThreadType.Group : ThreadType.User;

  await api.addReaction(icon, {
    data: { msgId: String(messageId), cliMsgId: String(cliMsgId ?? messageId) },
    threadId: String(threadId),
    type,
  });

  return NextResponse.json({ success: true });
}
