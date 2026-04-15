import { NextRequest, NextResponse } from "next/server";
import { startQRLogin, getLoginStatus } from "@/lib/zalo";

function sessionCookie(res: NextResponse, sid: string): NextResponse {
  res.cookies.set("zalo_sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function POST(req: NextRequest) {
  let sid = req.cookies.get("zalo_sid")?.value;
  if (!sid) sid = crypto.randomUUID();

  if (getLoginStatus(sid) === "logged_in") {
    return sessionCookie(NextResponse.json({ status: "logged_in" }), sid);
  }

  await startQRLogin(sid);
  return sessionCookie(NextResponse.json({ status: "qr_generated" }), sid);
}
