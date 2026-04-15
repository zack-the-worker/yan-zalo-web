import { NextRequest, NextResponse } from "next/server";
import { regenerateQRLogin } from "@/lib/zalo";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value;
  if (!sid) return NextResponse.json({ error: "No session" }, { status: 401 });
  await regenerateQRLogin(sid);
  return NextResponse.json({ status: "qr_generated" });
}
