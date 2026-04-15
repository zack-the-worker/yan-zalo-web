import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";
import { ThreadType } from "zca-js";
import { storeMessage, type ChatMessage } from "@/lib/messageStore";
import { getSocketServer } from "@/lib/socketServer";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const api = getZaloApi(sid);
  if (!api) {
    return NextResponse.json({ error: "API not ready" }, { status: 503 });
  }

  let body: { threadId?: string; threadType?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { threadId, threadType, text } = body;

  if (!threadId || !text?.trim()) {
    return NextResponse.json(
      { error: "threadId and text are required" },
      { status: 400 }
    );
  }

  const isGroup = threadType === "Group";
  const zaloType = isGroup ? ThreadType.Group : ThreadType.User;

  try {
    await api.sendMessage(text.trim(), threadId, zaloType);

    const ownId = api.getOwnId();
    const sentMsg: ChatMessage = {
      id: String(Date.now()),
      threadId,
      threadType: isGroup ? "Group" : "User",
      fromId: ownId ?? "me",
      fromName: "Tôi",
      content: text.trim(),
      ts: Date.now(),
      isSelf: true,
    };

    storeMessage(sentMsg, sid);

    const io = getSocketServer();
    if (io) {
      io.to(sid).emit("message", sentMsg);
    }

    return NextResponse.json({ ok: true, message: sentMsg });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
