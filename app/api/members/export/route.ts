import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";

export async function GET(req: NextRequest) {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const api = getZaloApi();
  if (!api) {
    return NextResponse.json({ error: "API not ready" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const link = searchParams.get("link");
  const format = searchParams.get("format") ?? "csv";

  if (!link || !link.startsWith("https://zalo.me/g/")) {
    return NextResponse.json({ error: "Invalid group link" }, { status: 400 });
  }

  // Fetch all pages
  const allMembers: Array<{
    id: string;
    dName: string;
    zaloName: string;
    avatar: string;
    accountStatus: number;
  }> = [];

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await api.getGroupLinkInfo({ link, memberPage: page });
    allMembers.push(...(data.currentMems ?? []));
    hasMore = data.hasMoreMember === 1;
    page++;
    if (page > 50) break; // safety limit
  }

  if (format === "json") {
    const json = JSON.stringify(allMembers, null, 2);
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="members.json"',
      },
    });
  }

  // CSV
  const header = "ID,Tên hiển thị,Zalo name,Status\n";
  const rows = allMembers
    .map(
      (m) =>
        `"${m.id}","${m.dName?.replace(/"/g, '""')}","${m.zaloName?.replace(/"/g, '""')}","${m.accountStatus}"`
    )
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="members.csv"',
    },
  });
}
