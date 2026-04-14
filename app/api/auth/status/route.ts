import { NextResponse } from "next/server";
import { getLoginStatus, trySessionLogin } from "@/lib/zalo";

export async function GET() {
  if (getLoginStatus() === "logged_in") {
    return NextResponse.json({ status: "logged_in" });
  }

  // Not logged in — try silent session resume before reporting failure
  const resumed = await trySessionLogin();
  return NextResponse.json({ status: resumed ? "logged_in" : getLoginStatus() });
}
