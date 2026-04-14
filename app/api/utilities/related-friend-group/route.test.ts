import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/zalo", () => ({
  isLoggedIn: vi.fn(() => false),
  getZaloApi: vi.fn(() => null),
}));

import { GET } from "./route";
import * as zaloMock from "@/lib/zalo";

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/utilities/related-friend-group");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return { nextUrl: url } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(zaloMock.isLoggedIn).mockReturnValue(false);
});

describe("GET /api/utilities/related-friend-group", () => {
  it("returns 401 when not logged in", async () => {
    const res = await GET(makeRequest({ uid: "user-123" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when uid param is missing", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 200 with enriched group list on success", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    vi.mocked(zaloMock.getZaloApi).mockReturnValue({
      getRelatedFriendGroup: vi.fn().mockResolvedValue({
        groupRelateds: { "user-123": ["group-1", "group-2"] },
      }),
      getGroupInfo: vi.fn().mockResolvedValue({
        gridInfoMap: {
          "group-1": { groupId: "group-1", name: "Nhóm Dev" },
          "group-2": { groupId: "group-2", name: "Nhóm Zalo" },
        },
      }),
    } as never);

    const res = await GET(makeRequest({ uid: "user-123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.uid).toBe("user-123");
    expect(body.groups).toHaveLength(2);
    expect(body.groups[0]).toMatchObject({ groupId: "group-1", groupName: "Nhóm Dev" });
    expect(body.groups[1]).toMatchObject({ groupId: "group-2", groupName: "Nhóm Zalo" });
  });

  it("returns 200 with empty groups when no common groups exist", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    vi.mocked(zaloMock.getZaloApi).mockReturnValue({
      getRelatedFriendGroup: vi.fn().mockResolvedValue({ groupRelateds: {} }),
      getGroupInfo: vi.fn().mockResolvedValue({ gridInfoMap: {} }),
    } as never);

    const res = await GET(makeRequest({ uid: "user-123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.groups).toEqual([]);
  });

  it("returns 500 and forwards error message on API failure", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    vi.mocked(zaloMock.getZaloApi).mockReturnValue({
      getRelatedFriendGroup: vi
        .fn()
        .mockRejectedValue(new Error("Zalo API error")),
    } as never);

    const res = await GET(makeRequest({ uid: "user-123" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Zalo API error");
  });
});
