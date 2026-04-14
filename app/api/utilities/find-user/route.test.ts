import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/zalo", () => ({
  isLoggedIn: vi.fn(() => false),
  getZaloApi: vi.fn(() => null),
}));

import { GET } from "./route";
import * as zaloMock from "@/lib/zalo";

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/utilities/find-user");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return { nextUrl: url } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(zaloMock.isLoggedIn).mockReturnValue(false);
});

describe("GET /api/utilities/find-user", () => {
  it("returns 401 when not logged in", async () => {
    const res = await GET(makeRequest({ phone: "0912345678" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when phone param is missing", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 200 with user data on success", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    const mockUser = {
      uid: "123",
      display_name: "Nguyễn Văn A",
      zalo_name: "nguyenvana",
      avatar: "https://example.com/avatar.jpg",
      gender: 1,
      status: "Xin chào",
    };
    vi.mocked(zaloMock.getZaloApi).mockReturnValue({
      findUser: vi.fn().mockResolvedValue(mockUser),
    } as never);

    const res = await GET(makeRequest({ phone: "0912345678" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ uid: "123", display_name: "Nguyễn Văn A" });
  });

  it("returns 500 and forwards error message on API failure", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    vi.mocked(zaloMock.getZaloApi).mockReturnValue({
      findUser: vi.fn().mockRejectedValue(new Error("Zalo API down")),
    } as never);

    const res = await GET(makeRequest({ phone: "0912345678" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Zalo API down");
  });
});
