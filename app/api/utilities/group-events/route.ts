import { NextRequest, NextResponse } from "next/server";
import { getGroupEvents, clearGroupEvents } from "@/lib/zalo";
import { isLoggedIn } from "@/lib/zalo";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  return NextResponse.json({ events: getGroupEvents(sid) });
}

export async function DELETE(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  clearGroupEvents(sid);
  return NextResponse.json({ ok: true });
}
