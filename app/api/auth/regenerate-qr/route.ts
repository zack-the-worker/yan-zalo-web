import { NextResponse } from "next/server";
import { regenerateQRLogin } from "@/lib/zalo";

export async function POST() {
  await regenerateQRLogin();
  return NextResponse.json({ status: "qr_generated" });
}
