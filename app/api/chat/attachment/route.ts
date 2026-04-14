import { NextResponse } from "next/server";
import { ThreadType } from "zca-js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isLoggedIn, getZaloApi } from "@/lib/zalo";

export async function POST(req: Request) {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const api = getZaloApi();
  if (!api) {
    return NextResponse.json({ error: "API not available" }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const threadId = formData.get("threadId") as string | null;
  const threadType = formData.get("threadType") as string | null;
  const textContent = formData.get("text") as string | null;

  if (!file || typeof (file as { arrayBuffer?: unknown }).arrayBuffer !== "function") {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!threadId?.trim()) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  const type = threadType === "Group" ? ThreadType.Group : ThreadType.User;
  const fileName = (file as { name?: string }).name ?? "upload";
  const ext = path.extname(fileName) || "";
  const tmpPath = path.join(os.tmpdir(), `zalo-upload-${Date.now()}${ext}`);

  try {
    const buffer = Buffer.from(await (file as { arrayBuffer(): Promise<ArrayBuffer> }).arrayBuffer());
    fs.writeFileSync(tmpPath, buffer);

    const result = await api.sendMessage(
      { msg: textContent?.trim() ?? "", attachments: [tmpPath] },
      threadId,
      type,
    );
    return NextResponse.json({ result });
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup error */ }
  }
}
