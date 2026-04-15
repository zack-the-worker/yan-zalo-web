import { describe, it, expect, beforeEach } from "vitest";
import { storeMessage, getMessages, updateMessageReaction } from "./messageStore";
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
    storeMessage(msg, "s1");
    const result = getMessages(msg.threadId, "s1");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(msg);
  });

  it("appends multiple messages to the same thread in order", () => {
    const msg1 = makeMsg({ id: "a", ts: 1000 });
    const msg2 = makeMsg({ id: "b", ts: 2000 });
    storeMessage(msg1, "s1");
    storeMessage(msg2, "s1");
    const result = getMessages("thread-1", "s1");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("b");
  });

  it("does not mix messages from different threadIds", () => {
    storeMessage(makeMsg({ id: "a", threadId: "thread-1" }), "s1");
    storeMessage(makeMsg({ id: "b", threadId: "thread-2" }), "s1");
    expect(getMessages("thread-1", "s1")).toHaveLength(1);
    expect(getMessages("thread-2", "s1")).toHaveLength(1);
    expect(getMessages("thread-1", "s1")[0].id).toBe("a");
    expect(getMessages("thread-2", "s1")[0].id).toBe("b");
  });
});

describe("getMessages", () => {
  it("returns [] for an unknown threadId", () => {
    expect(getMessages("nonexistent", "s1")).toEqual([]);
  });

  it("returns correct messages for the given threadId", () => {
    const msg = makeMsg({ id: "x", threadId: "t-x" });
    storeMessage(msg, "s1");
    storeMessage(makeMsg({ id: "y", threadId: "t-y" }), "s1");
    expect(getMessages("t-x", "s1")).toHaveLength(1);
    expect(getMessages("t-x", "s1")[0].id).toBe("x");
  });
});

describe("cliMsgId and reactions fields on ChatMessage", () => {
  it("stores and retrieves a message with cliMsgId", () => {
    const msg = makeMsg({ cliMsgId: "cli-abc-123" });
    storeMessage(msg, "s1");
    const result = getMessages(msg.threadId, "s1");
    expect(result[0].cliMsgId).toBe("cli-abc-123");
  });

  it("stores and retrieves a message with reactions array", () => {
    const msg = makeMsg({
      reactions: [{ icon: "/-heart", senderIds: ["u1"], senderNames: ["Alice"] }],
    });
    storeMessage(msg, "s1");
    const result = getMessages(msg.threadId, "s1");
    expect(result[0].reactions).toHaveLength(1);
    expect(result[0].reactions![0].icon).toBe("/-heart");
  });
});

describe("updateMessageReaction", () => {
  it("adds a new reaction to a message", () => {
    const msg = makeMsg({ id: "msg-r1" });
    storeMessage(msg, "s1");
    updateMessageReaction("thread-1", "msg-r1", "/-heart", "u2", "Bob", "s1");
    const result = getMessages("thread-1", "s1");
    expect(result[0].reactions).toHaveLength(1);
    expect(result[0].reactions![0]).toEqual({
      icon: "/-heart",
      senderIds: ["u2"],
      senderNames: ["Bob"],
    });
  });

  it("appends a new sender to an existing reaction icon", () => {
    const msg = makeMsg({ id: "msg-r2" });
    storeMessage(msg, "s1");
    updateMessageReaction("thread-1", "msg-r2", ":>", "u1", "Alice", "s1");
    updateMessageReaction("thread-1", "msg-r2", ":>", "u2", "Bob", "s1");
    const result = getMessages("thread-1", "s1");
    const reaction = result[0].reactions![0];
    expect(reaction.senderIds).toEqual(["u1", "u2"]);
    expect(reaction.senderNames).toEqual(["Alice", "Bob"]);
  });

  it("is idempotent — same sender + same icon does not duplicate", () => {
    const msg = makeMsg({ id: "msg-r3" });
    storeMessage(msg, "s1");
    updateMessageReaction("thread-1", "msg-r3", "/-heart", "u1", "Alice", "s1");
    updateMessageReaction("thread-1", "msg-r3", "/-heart", "u1", "Alice", "s1");
    const result = getMessages("thread-1", "s1");
    expect(result[0].reactions![0].senderIds).toEqual(["u1"]);
  });

  it("supports multiple different reaction icons on the same message", () => {
    const msg = makeMsg({ id: "msg-r4" });
    storeMessage(msg, "s1");
    updateMessageReaction("thread-1", "msg-r4", "/-heart", "u1", "Alice", "s1");
    updateMessageReaction("thread-1", "msg-r4", ":>", "u2", "Bob", "s1");
    const result = getMessages("thread-1", "s1");
    expect(result[0].reactions).toHaveLength(2);
  });

  it("does nothing when the message is not found", () => {
    updateMessageReaction("thread-1", "nonexistent", "/-heart", "u1", "Alice", "s1");
    expect(getMessages("thread-1", "s1")).toHaveLength(0);
  });
});

describe("deduplication by id (TDD — implementation pending)", () => {
  it("should not store a message with a duplicate id in the same thread", () => {
    const msg = makeMsg({ id: "dup" });
    storeMessage(msg, "s1");
    storeMessage(msg, "s1"); // same id
    // NOTE: This test is expected to FAIL because storeMessage does not
    // currently deduplicate by id. It is written here to drive that feature.
    expect(getMessages("thread-1", "s1")).toHaveLength(1);
  });
});
