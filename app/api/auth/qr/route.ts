import { NextRequest, NextResponse } from "next/server";
import { getQRImageBase64 } from "@/lib/zalo";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value;
  if (!sid) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }
  const base64 = getQRImageBase64(sid);
  if (!base64) {
    return NextResponse.json({ error: "QR not available" }, { status: 404 });
  }
  return NextResponse.json({ image: base64 });
}
