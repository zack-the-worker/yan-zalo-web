import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";
import { getConversations, upsertConversation } from "@/lib/messageStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const api = getZaloApi(sid);
  if (!api) {
    return NextResponse.json({ error: "API not ready" }, { status: 503 });
  }

  // Fetch friends list
  let friends: Array<{
    userId: string;
    zaloName: string;
    displayName: string;
    avatar: string;
  }> = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = await api.getAllFriends();
    friends = raw.map((u) => ({
      userId: u.userId ?? u.uid ?? u.id ?? "",
      zaloName: u.zaloName ?? "",
      displayName: u.displayName ?? u.dName ?? u.zaloName ?? "(No name)",
      avatar: u.avatar ?? "",
    }));

    // Seed conversations with friends so they show up in sidebar
    for (const f of friends) {
      upsertConversation({
        id: f.userId,
        type: "User",
        name: f.displayName,
        avatar: f.avatar,
      }, sid);
    }
  } catch (err) {
    console.error("[chat/conversations] getAllFriends error:", err);
  }

  // Fetch groups list and seed them
  try {
    const groupsRes = await api.getAllGroups();
    const groupIds = Object.keys(groupsRes.gridVerMap ?? {});
    if (groupIds.length > 0) {
      // getGroupInfo accepts array; batch all at once
      const infoRes = await api.getGroupInfo(groupIds);
      for (const [groupId, info] of Object.entries(infoRes.gridInfoMap ?? {})) {
        upsertConversation({
          id: groupId,
          type: "Group",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (info as any).name ?? groupId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          avatar: (info as any).avatar ?? (info as any).avt ?? "",
        }, sid);
      }
    }
  } catch (err) {
    console.error("[chat/conversations] getAllGroups error:", err);
  }

  const conversations = getConversations(sid);
  return NextResponse.json({ conversations, friends });
}
