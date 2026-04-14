import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";
import type { ChatMessage } from "@/lib/messageStore";

export async function GET(req: NextRequest) {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const groupId = req.nextUrl.searchParams.get("groupId");
  const count = Number(req.nextUrl.searchParams.get("count") ?? "50");

  if (!groupId) {
    return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
  }

  const api = getZaloApi()!;
  const ownId = api.getOwnId();

  try {
    const result = await api.getGroupChatHistory(groupId, count);
    const messages: ChatMessage[] = (result.groupMsgs ?? [])
      .map((msg) => {
        const data = msg.data;
        const isSelf = msg.isSelf ?? data.uidFrom === ownId;

        let content: string;
        let mediaType: ChatMessage["mediaType"];
        let mediaUrl: string | undefined;

        if (data.msgType === "chat.sticker") {
          content = "[Sticker]";
          mediaType = "sticker";
          // URL not resolved here (no async in map); frontend shows placeholder
        } else if (typeof data.content === "string") {
          content = data.content;
        } else if (
          data.content &&
          typeof data.content === "object" &&
          "msg" in data.content &&
          typeof (data.content as { msg: unknown }).msg === "string"
        ) {
          content = (data.content as { msg: string }).msg;
        } else {
          content = "[media]";
        }

        const chatMsg: ChatMessage = {
          id: String(data.msgId ?? data.cliMsgId ?? Date.now()),
          threadId: msg.threadId,
          threadType: "Group",
          fromId: data.uidFrom ?? "",
          fromName: data.dName ?? data.uidFrom ?? "",
          content,
          ts: Number(data.ts ?? 0),
          isSelf,
          ...(mediaType && { mediaType }),
          ...(mediaUrl && { mediaUrl }),
        };

        return chatMsg;
      })
      // Oldest first
      .sort((a, b) => a.ts - b.ts);

    return NextResponse.json({ messages, more: result.more });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load history" },
      { status: 500 }
    );
  }
}
