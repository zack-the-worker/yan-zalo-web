import { NextRequest, NextResponse } from "next/server";
import { restoreFromSession } from "@/lib/zalo";

export async function POST(req: NextRequest) {
  let sid = req.cookies.get("zalo_sid")?.value;
  if (!sid) sid = crypto.randomUUID();
  try {
    const data = await req.json();
    const ok = await restoreFromSession(data, sid);
    const res = NextResponse.json({ status: ok ? "logged_in" : "error" });
    if (ok) {
      res.cookies.set("zalo_sid", sid, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return res;
  } catch {
    return NextResponse.json({ status: "error" }, { status: 400 });
  }
}
