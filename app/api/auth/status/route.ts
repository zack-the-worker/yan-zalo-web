import { NextResponse } from "next/server";
import { getLoginStatus } from "@/lib/zalo";

export async function GET() {
  return NextResponse.json({ status: getLoginStatus() });
}
