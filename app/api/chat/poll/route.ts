import { NextResponse } from "next/server";
import { isLoggedIn, getZaloApi } from "@/lib/zalo";

export async function GET(req: Request) {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const api = getZaloApi();
  if (!api) {
    return NextResponse.json({ error: "API not available" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const pollIdParam = searchParams.get("pollId");

  if (!pollIdParam) {
    return NextResponse.json({ error: "pollId is required" }, { status: 400 });
  }

  const pollId = Number(pollIdParam);
  const poll = await api.getPollDetail(pollId);
  return NextResponse.json({ poll });
}

export async function POST(req: Request) {
  if (!isLoggedIn()) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const api = getZaloApi();
  if (!api) {
    return NextResponse.json({ error: "API not available" }, { status: 503 });
  }

  const body = await req.json();
  const { question, options, groupId, expiredTime, allowMultiChoices, isAnonymous } = body ?? {};

  if (!question?.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  if (!Array.isArray(options) || options.filter((o: string) => o?.trim()).length < 2) {
    return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
  }
  if (!groupId) {
    return NextResponse.json({ error: "groupId is required (polls are group-only)" }, { status: 400 });
  }

  const poll = await api.createPoll(
    {
      question: String(question).trim(),
      options: (options as string[]).filter((o) => o?.trim()),
      expiredTime: expiredTime ?? 0,
      allowMultiChoices: allowMultiChoices ?? false,
      isAnonymous: isAnonymous ?? false,
    },
    String(groupId)
  );

  return NextResponse.json({ poll });
}
