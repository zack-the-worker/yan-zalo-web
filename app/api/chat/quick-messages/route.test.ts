import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

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

describe("POST /api/chat/quick-messages", () => {
  it("returns 401 when not logged in", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    const req = new Request("http://localhost/api/chat/quick-messages", {
      method: "POST",
      body: JSON.stringify({ keyword: "hi", title: "Xin chào!" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when keyword or title missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ addQuickMessage: vi.fn() } as never);
    const req = new Request("http://localhost/api/chat/quick-messages", {
      method: "POST",
      body: JSON.stringify({ keyword: "" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("calls addQuickMessage and returns item", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockItem = { id: 2, keyword: "hi", type: 0, createdTime: 0, lastModified: 0, message: { title: "Xin chào!", params: null }, media: null };
    const mockApi = {
      addQuickMessage: vi.fn().mockResolvedValue({
        item: mockItem,
        version: 2,
      }),
    };
    vi.mocked(getZaloApi).mockReturnValue(mockApi as never);
    const req = new Request("http://localhost/api/chat/quick-messages", {
      method: "POST",
      body: JSON.stringify({ keyword: "hi", title: "Xin chào!" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.item.keyword).toBe("hi");
    expect(mockApi.addQuickMessage).toHaveBeenCalledWith({ keyword: "hi", title: "Xin chào!" });
  });

  it("returns 500 with error code when ZaloApiError is thrown", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const err = Object.assign(new Error("Item size not support"), { code: 821 });
    const mockApi = { addQuickMessage: vi.fn().mockRejectedValue(err) };
    vi.mocked(getZaloApi).mockReturnValue(mockApi as never);
    const req = new Request("http://localhost/api/chat/quick-messages", {
      method: "POST",
      body: JSON.stringify({ keyword: "tambiet", title: "tạm biệt" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Item size not support");
    expect(body.code).toBe(821);
  });
});
