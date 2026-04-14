import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock heavy / side-effectful dependencies so the module can be imported cleanly
vi.mock("zca-js", () => ({
  Zalo: vi.fn(),
  ThreadType: { User: "User", Group: "Group" },
}));

vi.mock("./socketServer", () => ({
  getSocketServer: vi.fn(() => null),
}));

vi.mock("./messageStore", () => ({
  storeMessage: vi.fn(),
  getMessages: vi.fn(() => []),
  updateMessageReaction: vi.fn(),
}));

// Import after mocks are registered
import {
  getGroupEvents,
  clearGroupEvents,
  getLoginStatus,
  wireMessageListener,
} from "./zalo";
import type { GroupEventLog } from "./zalo";
import { updateMessageReaction, getMessages } from "./messageStore";
import { getSocketServer } from "./socketServer";

function makeEvent(overrides: Partial<GroupEventLog> = {}): GroupEventLog {
  return {
    id: "evt-1",
    type: "join",
    groupId: "g-1",
    groupName: "Test Group",
    memberNames: ["Alice"],
    memberIds: ["u-1"],
    ts: 1000,
    ...overrides,
  };
}

beforeEach(() => {
  global.__groupEvents = undefined;
  global.__zaloState = undefined;
});

describe("getGroupEvents", () => {
  it("returns [] when no events have been recorded", () => {
    expect(getGroupEvents()).toEqual([]);
  });

  it("returns a copy of stored events", () => {
    global.__groupEvents = [makeEvent()];
    const result = getGroupEvents();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("evt-1");
    // Must be a copy, not the same array reference
    expect(result).not.toBe(global.__groupEvents);
  });
});

describe("clearGroupEvents", () => {
  it("empties the event store", () => {
    global.__groupEvents = [makeEvent(), makeEvent({ id: "evt-2" })];
    clearGroupEvents();
    expect(getGroupEvents()).toEqual([]);
  });

  it("is a no-op when the store is already empty", () => {
    expect(() => clearGroupEvents()).not.toThrow();
    expect(getGroupEvents()).toEqual([]);
  });
});

describe("getLoginStatus", () => {
  it("returns 'idle' when no state has been initialized", () => {
    expect(getLoginStatus()).toBe("idle");
  });
});

describe("wireMessageListener — reaction event", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls updateMessageReaction when a reaction event fires", () => {
    const handlers: Record<string, (event: unknown) => void> = {};
    const mockApi = {
      listener: { on: vi.fn((event: string, cb: (e: unknown) => void) => { handlers[event] = cb; }) },
      getOwnId: vi.fn(() => "own-id"),
      getStickersDetail: vi.fn(),
    };

    wireMessageListener(mockApi as never);

    handlers["reaction"]({
      threadId: "t-1",
      data: {
        msgId: "m-1",
        uidFrom: "u-2",
        dName: "Bob",
        content: { rIcon: "/-heart" },
      },
    });

    expect(updateMessageReaction).toHaveBeenCalledWith("t-1", "m-1", "/-heart", "u-2", "Bob");
  });

  it("emits message_reaction via socket when reaction fires and io is available", () => {
    const mockEmit = vi.fn();
    vi.mocked(getSocketServer).mockReturnValue({ emit: mockEmit } as never);
    vi.mocked(getMessages).mockReturnValue([
      { id: "m-1", threadId: "t-1", reactions: [{ icon: "/-heart", senderIds: ["u-2"], senderNames: ["Bob"] }] } as never,
    ]);

    const handlers: Record<string, (event: unknown) => void> = {};
    const mockApi = {
      listener: { on: vi.fn((event: string, cb: (e: unknown) => void) => { handlers[event] = cb; }) },
      getOwnId: vi.fn(() => "own-id"),
      getStickersDetail: vi.fn(),
    };

    wireMessageListener(mockApi as never);

    handlers["reaction"]({
      threadId: "t-1",
      data: { msgId: "m-1", uidFrom: "u-2", dName: "Bob", content: { rIcon: "/-heart" } },
    });

    expect(mockEmit).toHaveBeenCalledWith("message_reaction", expect.objectContaining({
      threadId: "t-1",
      msgId: "m-1",
    }));
  });

  it("does nothing when icon is missing from reaction event", () => {
    const handlers: Record<string, (event: unknown) => void> = {};
    const mockApi = {
      listener: { on: vi.fn((event: string, cb: (e: unknown) => void) => { handlers[event] = cb; }) },
      getOwnId: vi.fn(() => "own-id"),
      getStickersDetail: vi.fn(),
    };

    wireMessageListener(mockApi as never);

    handlers["reaction"]({ threadId: "t-1", data: { msgId: "m-1", uidFrom: "u-2", content: {} } });

    expect(updateMessageReaction).not.toHaveBeenCalled();
  });
});
