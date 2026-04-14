import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";

export async function GET(req: NextRequest) {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "Thiếu tham số phone" }, { status: 400 });
  }

  const api = getZaloApi()!;
  try {
    const user = await api.findUser(phone);
    return NextResponse.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
