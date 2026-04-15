import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("zca-js", () => ({
  ThreadType: { User: "User", Group: "Group" },
}));

vi.mock("@/lib/zalo", () => ({
  isLoggedIn: vi.fn(),
  getZaloApi: vi.fn(),
}));

import { isLoggedIn, getZaloApi } from "@/lib/zalo";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/chat/forward", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "Cookie": "zalo_sid=test-sid" },
  });
}

describe("POST /api/chat/forward", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not logged in", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    const res = await POST(makeRequest({ messageContent: "hi", messageId: "m-1", messageTs: 1000, targetThreadId: "t-2", targetThreadType: "User" }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when messageContent is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ forwardMessage: vi.fn() } as never);
    const res = await POST(makeRequest({ messageId: "m-1", messageTs: 1000, targetThreadId: "t-2", targetThreadType: "User" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when targetThreadId is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ forwardMessage: vi.fn() } as never);
    const res = await POST(makeRequest({ messageContent: "hi", messageId: "m-1", messageTs: 1000, targetThreadType: "User" }) as never);
    expect(res.status).toBe(400);
  });

  it("calls forwardMessage with [targetThreadId] array and returns success", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockForward = vi.fn().mockResolvedValue({ success: [{ clientId: "c-1", msgId: "m-2" }], fail: [] });
    vi.mocked(getZaloApi).mockReturnValue({ forwardMessage: mockForward } as never);
    const res = await POST(makeRequest({
      messageContent: "Hello!",
      messageId: "m-1",
      messageTs: 1000,
      targetThreadId: "t-2",
      targetThreadType: "Group",
    }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toHaveLength(1);
    expect(mockForward).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Hello!" }),
      ["t-2"],
      "Group"
    );
  });

  it("returns 422 when all forwards fail", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockForward = vi.fn().mockResolvedValue({ success: [], fail: [{ clientId: "c-1", error_code: "403" }] });
    vi.mocked(getZaloApi).mockReturnValue({ forwardMessage: mockForward } as never);
    const res = await POST(makeRequest({
      messageContent: "hi",
      messageId: "m-1",
      messageTs: 1000,
      targetThreadId: "t-2",
      targetThreadType: "User",
    }) as never);
    expect(res.status).toBe(422);
  });
});
