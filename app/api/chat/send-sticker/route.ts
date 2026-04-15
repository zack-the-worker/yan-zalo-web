import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";
import { ThreadType } from "zca-js";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json();
  const { threadId, threadType, id, cateId, type } = body as {
    threadId: string;
    threadType: "User" | "Group";
    id: number;
    cateId: number;
    type: number;
  };

  if (!threadId || !id || !cateId || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const api = getZaloApi(sid)!;
  try {
    const result = await api.sendSticker(
      { id, cateId, type },
      threadId,
      threadType === "Group" ? ThreadType.Group : ThreadType.User
    );
    return NextResponse.json({ msgId: result.msgId });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send sticker" },
      { status: 500 }
    );
  }
}
