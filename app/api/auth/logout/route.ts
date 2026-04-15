import { NextRequest, NextResponse } from "next/server";
import { resetLogin } from "@/lib/zalo";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value;
  if (sid) resetLogin(sid);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("zalo_sid", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
