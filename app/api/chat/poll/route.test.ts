import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("zca-js", () => ({
  ThreadType: { User: "User", Group: "Group" },
}));

vi.mock("@/lib/zalo", () => ({
  isLoggedIn: vi.fn(),
  getZaloApi: vi.fn(),
}));

import { isLoggedIn, getZaloApi } from "@/lib/zalo";

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/chat/poll", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "Cookie": "zalo_sid=test-sid" },
  });
}

describe("POST /api/chat/poll (createPoll)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not logged in", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    const res = await POST(makePostRequest({ question: "?", options: ["a", "b"], groupId: "g-1" }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when question is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ createPoll: vi.fn() } as never);
    const res = await POST(makePostRequest({ options: ["a", "b"], groupId: "g-1" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when fewer than 2 options are provided", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ createPoll: vi.fn() } as never);
    const res = await POST(makePostRequest({ question: "Bình chọn?", options: ["only one"], groupId: "g-1" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when groupId is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ createPoll: vi.fn() } as never);
    const res = await POST(makePostRequest({ question: "?", options: ["a", "b"] }) as never);
    expect(res.status).toBe(400);
  });

  it("calls createPoll and returns 200 with poll data", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockCreate = vi.fn().mockResolvedValue({ pollId: 42, question: "Bình chọn?" });
    vi.mocked(getZaloApi).mockReturnValue({ createPoll: mockCreate } as never);
    const res = await POST(makePostRequest({
      question: "Bình chọn?",
      options: ["Có", "Không"],
      groupId: "g-1",
      allowMultiChoices: true,
    }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.poll).toBeDefined();
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ question: "Bình chọn?", options: ["Có", "Không"] }),
      "g-1"
    );
  });
});

describe("GET /api/chat/poll (getPollDetail)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not logged in", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/chat/poll?pollId=42", { headers: { "Cookie": "zalo_sid=test-sid" } });
    const res = await GET(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when pollId is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ getPollDetail: vi.fn() } as never);
    const req = new NextRequest("http://localhost/api/chat/poll", { headers: { "Cookie": "zalo_sid=test-sid" } });
    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });

  it("calls getPollDetail and returns poll data", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockDetail = vi.fn().mockResolvedValue({ pollId: 42, question: "Test?" });
    vi.mocked(getZaloApi).mockReturnValue({ getPollDetail: mockDetail } as never);
    const req = new NextRequest("http://localhost/api/chat/poll?pollId=42", { headers: { "Cookie": "zalo_sid=test-sid" } });
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    expect(mockDetail).toHaveBeenCalledWith(42);
  });
});
