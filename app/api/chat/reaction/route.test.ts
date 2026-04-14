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
  return new Request("http://localhost/api/chat/reaction", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/chat/reaction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not logged in", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    const res = await POST(makeRequest({ icon: "/-heart", messageId: "m-1", cliMsgId: "c-1", threadId: "t-1", threadType: "User" }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when icon is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ addReaction: vi.fn() } as never);
    const res = await POST(makeRequest({ messageId: "m-1", cliMsgId: "c-1", threadId: "t-1", threadType: "User" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when messageId is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ addReaction: vi.fn() } as never);
    const res = await POST(makeRequest({ icon: "/-heart", cliMsgId: "c-1", threadId: "t-1", threadType: "User" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when threadId is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ addReaction: vi.fn() } as never);
    const res = await POST(makeRequest({ icon: "/-heart", messageId: "m-1", cliMsgId: "c-1", threadType: "User" }) as never);
    expect(res.status).toBe(400);
  });

  it("calls addReaction and returns 200 on success", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockAddReaction = vi.fn().mockResolvedValue({ msgIds: [1] });
    vi.mocked(getZaloApi).mockReturnValue({ addReaction: mockAddReaction } as never);

    const res = await POST(makeRequest({
      icon: "/-heart",
      messageId: "m-1",
      cliMsgId: "c-1",
      threadId: "t-1",
      threadType: "User",
    }) as never);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockAddReaction).toHaveBeenCalledWith(
      "/-heart",
      expect.objectContaining({ data: { msgId: "m-1", cliMsgId: "c-1" }, threadId: "t-1" })
    );
  });

  it("calls addReaction with Group ThreadType for group threads", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockAddReaction = vi.fn().mockResolvedValue({ msgIds: [2] });
    vi.mocked(getZaloApi).mockReturnValue({ addReaction: mockAddReaction } as never);

    await POST(makeRequest({
      icon: ":>",
      messageId: "m-2",
      cliMsgId: "c-2",
      threadId: "g-1",
      threadType: "Group",
    }) as never);

    expect(mockAddReaction).toHaveBeenCalledWith(
      ":>",
      expect.objectContaining({ type: "Group" })
    );
  });
});
