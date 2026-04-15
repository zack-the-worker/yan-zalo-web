import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";
import type { RelatedGroupsEnriched } from "@/types/utilities";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Thiếu tham số uid" }, { status: 400 });
  }

  const api = getZaloApi(sid)!;
  try {
    const relatedRes = await api.getRelatedFriendGroup(uid);
    const groupIds: string[] = relatedRes.groupRelateds[uid] ?? [];

    if (groupIds.length === 0) {
      const result: RelatedGroupsEnriched = { uid, groups: [] };
      return NextResponse.json(result);
    }

    const groupInfoRes = await api.getGroupInfo(groupIds);
    const groups = groupIds.map((groupId) => ({
      groupId,
      groupName: groupInfoRes.gridInfoMap[groupId]?.name ?? groupId,
    }));

    const result: RelatedGroupsEnriched = { uid, groups };
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
