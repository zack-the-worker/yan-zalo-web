import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const api = getZaloApi(sid)!;
  try {
    const result = await api.getQuickMessageList();
    return NextResponse.json({ items: result.items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }
  const api = getZaloApi(sid)!;
  let body: { keyword?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { keyword, title } = body;
  if (!keyword?.trim() || !title?.trim()) {
    return NextResponse.json({ error: "keyword và title là bắt buộc" }, { status: 400 });
  }
  try {
    const result = await api.addQuickMessage({ keyword: keyword.trim(), title: title.trim() });
    return NextResponse.json({ item: result.item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    const code = (err as { code?: number }).code ?? null;
    return NextResponse.json({ error: message, code }, { status: 500 });
  }
}
