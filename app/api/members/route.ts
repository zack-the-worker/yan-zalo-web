import { NextRequest, NextResponse } from "next/server";
import { getZaloApi, isLoggedIn } from "@/lib/zalo";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value ?? "";
  if (!sid || !isLoggedIn(sid)) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const api = getZaloApi(sid);
  if (!api) {
    return NextResponse.json({ error: "API not ready" }, { status: 503 });
  }

  let body: { link?: string; page?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { link, page = 1 } = body;

  if (!link || typeof link !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'link' field" },
      { status: 400 }
    );
  }

  // Validate it looks like a Zalo group link
  if (!link.startsWith("https://zalo.me/g/")) {
    return NextResponse.json(
      { error: "Link phải có dạng https://zalo.me/g/..." },
      { status: 400 }
    );
  }

  try {
    const data = await api.getGroupLinkInfo({ link, memberPage: page });
    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
