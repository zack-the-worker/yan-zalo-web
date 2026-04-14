import { NextResponse } from "next/server";
import { getGroupEvents, clearGroupEvents } from "@/lib/zalo";
import { isLoggedIn } from "@/lib/zalo";

export async function GET() {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  return NextResponse.json({ events: getGroupEvents() });
}

export async function DELETE() {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  clearGroupEvents();
  return NextResponse.json({ ok: true });
}
