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

function makeReq(fields: { file?: unknown; threadId?: string; threadType?: string; text?: string }) {
  const mockFormData = {
    get: vi.fn((k: string) => {
      if (k === "file") return fields.file ?? null;
      if (k === "threadId") return fields.threadId ?? null;
      if (k === "threadType") return fields.threadType ?? null;
      if (k === "text") return fields.text ?? null;
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
    vi.mocked(getZaloApi).mockReturnValue({ sendMessage: vi.fn() } as never);
    const res = await POST(makeReq({ threadId: "t-1", threadType: "User" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when threadId is missing", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    vi.mocked(getZaloApi).mockReturnValue({ sendMessage: vi.fn() } as never);
    const res = await POST(makeReq({ file: makeFile() }));
    expect(res.status).toBe(400);
  });

  it("calls sendMessage with attachment and returns 200 on success", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockSend = vi.fn().mockResolvedValue({ message: null, attachment: [{}] });
    vi.mocked(getZaloApi).mockReturnValue({ sendMessage: mockSend } as never);
    const res = await POST(makeReq({ file: makeFile("test.pdf"), threadId: "t-1", threadType: "User" }));
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ msg: "", attachments: expect.any(Array) }),
      "t-1",
      "User",
    );
  });

  it("sends text along with attachment when text field provided", async () => {
    vi.mocked(isLoggedIn).mockReturnValue(true);
    const mockSend = vi.fn().mockResolvedValue({ message: null, attachment: [{}] });
    vi.mocked(getZaloApi).mockReturnValue({ sendMessage: mockSend } as never);
    const res = await POST(makeReq({ file: makeFile("img.png"), threadId: "g-1", threadType: "Group", text: "Hello" }));
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ msg: "Hello", attachments: expect.any(Array) }),
      "g-1",
      "Group",
    );
  });
});
