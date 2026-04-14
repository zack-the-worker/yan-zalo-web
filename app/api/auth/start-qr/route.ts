import { NextResponse } from "next/server";
import { startQRLogin, getLoginStatus } from "@/lib/zalo";

export async function POST() {
  if (getLoginStatus() === "logged_in") {
    return NextResponse.json({ status: "logged_in" });
  }

  await startQRLogin();
  return NextResponse.json({ status: "qr_generated" });
}
