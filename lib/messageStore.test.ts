import { describe, it, expect, beforeEach } from "vitest";
import { storeMessage, getMessages } from "./messageStore";
import type { ChatMessage } from "./messageStore";

function makeMsg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    threadId: "thread-1",
    threadType: "User",
    fromId: "user-1",
    fromName: "Alice",
    content: "Hello",
    ts: 1000,
    isSelf: false,
    ...overrides,
  };
}

beforeEach(() => {
  // Reset the global in-memory store before each test
  global.__messageStore = undefined;
});

describe("storeMessage", () => {
  it("stores a message and makes it retrievable by threadId", () => {
    const msg = makeMsg();
    storeMessage(msg);
    const result = getMessages(msg.threadId);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(msg);
  });

  it("appends multiple messages to the same thread in order", () => {
    const msg1 = makeMsg({ id: "a", ts: 1000 });
    const msg2 = makeMsg({ id: "b", ts: 2000 });
    storeMessage(msg1);
    storeMessage(msg2);
    const result = getMessages("thread-1");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("b");
  });

  it("does not mix messages from different threadIds", () => {
    storeMessage(makeMsg({ id: "a", threadId: "thread-1" }));
    storeMessage(makeMsg({ id: "b", threadId: "thread-2" }));
    expect(getMessages("thread-1")).toHaveLength(1);
    expect(getMessages("thread-2")).toHaveLength(1);
    expect(getMessages("thread-1")[0].id).toBe("a");
    expect(getMessages("thread-2")[0].id).toBe("b");
  });
});

describe("getMessages", () => {
  it("returns [] for an unknown threadId", () => {
    expect(getMessages("nonexistent")).toEqual([]);
  });

  it("returns correct messages for the given threadId", () => {
    const msg = makeMsg({ id: "x", threadId: "t-x" });
    storeMessage(msg);
    storeMessage(makeMsg({ id: "y", threadId: "t-y" }));
    expect(getMessages("t-x")).toHaveLength(1);
    expect(getMessages("t-x")[0].id).toBe("x");
  });
});

describe("deduplication by id (TDD — implementation pending)", () => {
  it("should not store a message with a duplicate id in the same thread", () => {
    const msg = makeMsg({ id: "dup" });
    storeMessage(msg);
    storeMessage(msg); // same id
    // NOTE: This test is expected to FAIL because storeMessage does not
    // currently deduplicate by id. It is written here to drive that feature.
    expect(getMessages("thread-1")).toHaveLength(1);
  });
});
