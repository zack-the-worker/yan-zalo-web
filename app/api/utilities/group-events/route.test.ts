import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @/lib/zalo before importing the route handler
vi.mock("@/lib/zalo", () => ({
  isLoggedIn: vi.fn(() => false),
  getGroupEvents: vi.fn(() => []),
  clearGroupEvents: vi.fn(),
}));

import { GET, DELETE } from "./route";
import * as zaloMock from "@/lib/zalo";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(zaloMock.isLoggedIn).mockReturnValue(false);
});

describe("GET /api/utilities/group-events", () => {
  it("returns 401 when not logged in", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 200 with events when logged in", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    vi.mocked(zaloMock.getGroupEvents).mockReturnValue([
      {
        id: "e1",
        type: "join",
        groupId: "g1",
        groupName: "Group A",
        memberNames: ["Bob"],
        memberIds: ["u1"],
        ts: 1000,
      },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toHaveLength(1);
  });
});

describe("DELETE /api/utilities/group-events", () => {
  it("returns 401 when not logged in", async () => {
    const res = await DELETE();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("clears events and returns ok:true when logged in", async () => {
    vi.mocked(zaloMock.isLoggedIn).mockReturnValue(true);
    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(zaloMock.clearGroupEvents).toHaveBeenCalledOnce();
  });
});
