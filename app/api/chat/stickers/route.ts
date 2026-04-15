import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ stickers: [] });
  }

  const api = getZaloApi(sid)!;
  try {
    const stickerIds = await api.getStickers(q.trim());
    if (!stickerIds || stickerIds.length === 0) {
      return NextResponse.json({ stickers: [] });
    }
    const details = await api.getStickersDetail(stickerIds.slice(0, 24));
    return NextResponse.json({ stickers: details });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to search stickers" },
      { status: 500 }
    );
  }
}
