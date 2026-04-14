import { NextResponse } from "next/server";
import { restoreFromSession } from "@/lib/zalo";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const ok = await restoreFromSession(data);
    return NextResponse.json({ status: ok ? "logged_in" : "error" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 400 });
  }
}
