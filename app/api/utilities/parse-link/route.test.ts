import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/zalo", () => ({
  isLoggedIn: vi.fn(() => false),
  getZaloApi: vi.fn(() => null),
}));

import { GET } from "./route";
import * as zaloMock from "@/lib/zalo";

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/utilities/parse-link");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return { nextUrl: url } as unknown as import("next/server").NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(zaloMock.isLoggedIn).mockReturnValue(false);
});

describe("GET /api/utilities/parse-link", () => {
  it("returns 401 when not logged in", async () => {
    const res = await GET(makeRequest({ url: "https://example.com" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when url param is missing", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 200 with parsed link data on success", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    const mockData = {
      data: {
        thumb: "https://example.com/thumb.jpg",
        title: "Example Title",
        desc: "Example description",
        src: "https://example.com",
        href: "https://example.com",
        media: {
          type: 0,
          count: 0,
          mediaTitle: "",
          artist: "",
          streamUrl: "",
          stream_icon: "",
        },
        stream_icon: "",
      },
      error_maps: {},
    };
    vi.mocked(zaloMock.getZaloApi).mockReturnValue({
      parseLink: vi.fn().mockResolvedValue(mockData),
    } as never);

    const res = await GET(makeRequest({ url: "https://example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.title).toBe("Example Title");
    expect(body.data.thumb).toBe("https://example.com/thumb.jpg");
  });

  it("returns 500 and forwards error message on API failure", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    vi.mocked(zaloMock.getZaloApi).mockReturnValue({
      parseLink: vi.fn().mockRejectedValue(new Error("Link parse failed")),
    } as never);

    const res = await GET(makeRequest({ url: "https://example.com" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Link parse failed");
  });
});
