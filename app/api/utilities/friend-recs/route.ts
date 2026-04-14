import { NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";

export async function GET() {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const api = getZaloApi()!;
  try {
    const result = await api.getFriendRecommendations();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
