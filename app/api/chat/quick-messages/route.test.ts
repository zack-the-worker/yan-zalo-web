import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/zalo", () => ({
  isLoggedIn: vi.fn(),
  getZaloApi: vi.fn(),
}));

import { isLoggedIn, getZaloApi } from "@/lib/zalo";

describe("GET /api/chat/quick-messages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not logged in", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns items from getQuickMessageList", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockApi = {
      getQuickMessageList: vi.fn().mockResolvedValue({
        items: [{ id: 1, keyword: "hi", type: 0, createdTime: 0, lastModified: 0, message: { title: "Xin chào!", params: null }, media: null }],
        cursor: 0,
        version: 1,
      }),
    };
    vi.mocked(getZaloApi).mockReturnValue(mockApi as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].keyword).toBe("hi");
  });
});
