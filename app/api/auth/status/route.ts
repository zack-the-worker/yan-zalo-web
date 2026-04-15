import { NextRequest, NextResponse } from "next/server";
import { getLoginStatus } from "@/lib/zalo";

export async function GET(req: NextRequest) {
  const sid = req.cookies.get("zalo_sid")?.value;
  if (!sid) return NextResponse.json({ status: "idle" });
  return NextResponse.json({ status: getLoginStatus(sid) });
}
