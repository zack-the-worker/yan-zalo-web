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
}));

// Import after mocks are registered
import {
  getGroupEvents,
  clearGroupEvents,
  getLoginStatus,
} from "./zalo";
import type { GroupEventLog } from "./zalo";

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
