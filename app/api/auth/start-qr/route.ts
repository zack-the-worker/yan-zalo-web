import { NextResponse } from "next/server";
import { startQRLogin, getLoginStatus, trySessionLogin } from "@/lib/zalo";

export async function POST() {
  const status = getLoginStatus();

  if (status === "logged_in") {
    return NextResponse.json({ status: "logged_in" });
  }

  // Try resuming saved session first
  const resumed = await trySessionLogin();
  if (resumed) {
    return NextResponse.json({ status: "logged_in" });
  }

  // Fall back to QR login
  await startQRLogin();

  return NextResponse.json({ status: "qr_generated" });
}
