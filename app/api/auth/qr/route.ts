import { NextResponse } from "next/server";
import { getQRImageBase64 } from "@/lib/zalo";

export async function GET() {
  const base64 = getQRImageBase64();
  if (!base64) {
    return NextResponse.json({ error: "QR not available" }, { status: 404 });
  }
  return NextResponse.json({ image: base64 });
}
