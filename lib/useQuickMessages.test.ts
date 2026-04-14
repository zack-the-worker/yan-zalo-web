import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuickMessages } from "./useQuickMessages";

global.fetch = vi.fn();

const mockItem = {
  id: 1,
  keyword: "hi",
  type: 0,
  createdTime: 0,
  lastModified: 0,
  message: { title: "Xin chào!", params: null },
  media: null,
};

describe("useQuickMessages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads templates on mount", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [mockItem] }),
    } as Response);

    const { result } = renderHook(() => useQuickMessages());
    await waitFor(() => expect(result.current.templates).toHaveLength(1));
    expect(result.current.templates[0].keyword).toBe("hi");
  });

  it("starts loading=true and loading=false when done", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);

    const { result } = renderHook(() => useQuickMessages());
    // initially loading is true
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("addTemplate calls POST then refreshes list", async () => {
    const newItem = { ...mockItem, id: 2, keyword: "ty", message: { title: "Cảm ơn!", params: null } };
    vi.mocked(fetch)
      // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) } as Response)
      // POST addTemplate
      .mockResolvedValueOnce({ ok: true, json: async () => ({ item: newItem }) } as Response)
      // refresh after add
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [newItem] }) } as Response);

    const { result } = renderHook(() => useQuickMessages());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addTemplate("ty", "Cảm ơn!");
    });

    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].keyword).toBe("ty");

    // Verify POST was called with correct args
    const calls = vi.mocked(fetch).mock.calls;
    const postCall = calls.find((c) => c[1]?.method === "POST");
    expect(postCall).toBeDefined();
    expect(JSON.parse(postCall![1]!.body as string)).toEqual({ keyword: "ty", title: "Cảm ơn!" });
  });
});
