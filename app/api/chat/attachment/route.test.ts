import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("zca-js", () => ({
  ThreadType: { User: "User", Group: "Group" },
}));

vi.mock("@/lib/zalo", () => ({
  isLoggedIn: vi.fn(),
  getZaloApi: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: {
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
}));

vi.mock("node:os", () => ({
  default: { tmpdir: vi.fn(() => "/tmp") },
}));

import { isLoggedIn, getZaloApi } from "@/lib/zalo";

function makeFile(name = "test.txt") {
  return { name, arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(5)) };
}

function makeReq(fields: { file?: unknown; threadId?: string; threadType?: string }) {
  const mockFormData = {
    get: vi.fn((k: string) => {
      if (k === "file") return fields.file ?? null;
      if (k === "threadId") return fields.threadId ?? null;
      if (k === "threadType") return fields.threadType ?? null;
      return null;
    }),
  };
  return { formData: vi.fn().mockResolvedValue(mockFormData) } as never;
}

describe("POST /api/chat/attachment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not logged in", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(false);
    const res = await POST(makeReq({ file: makeFile(), threadId: "t-1", threadType: "User" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no file is provided", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ uploadAttachment: vi.fn() } as never);
    const res = await POST(makeReq({ threadId: "t-1", threadType: "User" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when threadId is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ uploadAttachment: vi.fn() } as never);
    const res = await POST(makeReq({ file: makeFile() }));
    expect(res.status).toBe(400);
  });

  it("calls uploadAttachment and returns 200 on success", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockUpload = vi.fn().mockResolvedValue([{ fileType: "others", fileUrl: "https://example.com/f.pdf" }]);
    vi.mocked(getZaloApi).mockReturnValue({ uploadAttachment: mockUpload } as never);
    const res = await POST(makeReq({ file: makeFile("test.pdf"), threadId: "t-1", threadType: "User" }));
    expect(res.status).toBe(200);
    expect(mockUpload).toHaveBeenCalledOnce();
  });
});
