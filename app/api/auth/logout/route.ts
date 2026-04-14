import { NextResponse } from "next/server";
import { resetLogin } from "@/lib/zalo";

export async function POST() {
  resetLogin();
  return NextResponse.json({ ok: true });
}
