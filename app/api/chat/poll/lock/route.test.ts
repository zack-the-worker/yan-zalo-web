import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/zalo", () => ({
  isLoggedIn: vi.fn(),
  getZaloApi: vi.fn(),
}));

import { isLoggedIn, getZaloApi } from "@/lib/zalo";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/chat/poll/lock", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "Cookie": "zalo_sid=test-sid" },
  });
}

describe("POST /api/chat/poll/lock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not logged in", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    const res = await POST(makeRequest({ pollId: 42 }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when pollId is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ lockPoll: vi.fn() } as never);
    const res = await POST(makeRequest({}) as never);
    expect(res.status).toBe(400);
  });

  it("calls lockPoll and returns 200", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockLock = vi.fn().mockResolvedValue("");
    vi.mocked(getZaloApi).mockReturnValue({ lockPoll: mockLock } as never);
    const res = await POST(makeRequest({ pollId: 42 }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockLock).toHaveBeenCalledWith(42);
  });
});
