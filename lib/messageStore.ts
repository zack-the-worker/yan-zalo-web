// Shared types for chat messages used in both server and client
export type ThreadType = "User" | "Group";

export type MediaType = "sticker" | "image" | "video";

export interface ChatMessage {
  id: string; // msgId or cliMsgId
  threadId: string;
  threadType: ThreadType;
  fromId: string; // sender userId
  fromName: string;
  content: string; // text content (or label like "[Sticker]")
  ts: number; // unix timestamp ms
  isSelf: boolean;
  mediaType?: MediaType;
  mediaUrl?: string; // resolved URL for sticker/image/video
}

export interface Conversation {
  id: string;
  type: ThreadType;
  name: string;
  avatar?: string;
  lastMessage?: ChatMessage;
  unread: number;
}

// In-memory store
declare global {
  // eslint-disable-next-line no-var
  var __messageStore:
    | {
        // threadId → message list (capped at 200 per thread)
        messages: Map<string, ChatMessage[]>;
        // threadId → conversation metadata
        conversations: Map<string, Conversation>;
      }
    | undefined;
}

function getStore() {
  if (!global.__messageStore) {
    global.__messageStore = {
      messages: new Map(),
      conversations: new Map(),
    };
  }
  return global.__messageStore;
}

const MAX_PER_THREAD = 200;

export function storeMessage(msg: ChatMessage): void {
  const store = getStore();
  const msgs = store.messages.get(msg.threadId) ?? [];
  msgs.push(msg);
  if (msgs.length > MAX_PER_THREAD) msgs.shift();
  store.messages.set(msg.threadId, msgs);

  // Update conversation last message
  const existing = store.conversations.get(msg.threadId);
  if (existing) {
    existing.lastMessage = msg;
    if (!msg.isSelf) existing.unread += 1;
  } else {
    store.conversations.set(msg.threadId, {
      id: msg.threadId,
      type: msg.threadType,
      name: msg.threadId, // placeholder until enriched with actual name
      lastMessage: msg,
      unread: msg.isSelf ? 0 : 1,
    });
  }
}

export function getMessages(threadId: string): ChatMessage[] {
  return getStore().messages.get(threadId) ?? [];
}

export function getConversations(): Conversation[] {
  return Array.from(getStore().conversations.values()).sort(
    (a, b) => (b.lastMessage?.ts ?? 0) - (a.lastMessage?.ts ?? 0)
  );
}

export function upsertConversation(conv: Partial<Conversation> & { id: string }): void {
  const store = getStore();
  const existing = store.conversations.get(conv.id) ?? {
    id: conv.id,
    type: conv.type ?? "User",
    name: conv.name ?? conv.id,
    unread: 0,
  };
  store.conversations.set(conv.id, { ...existing, ...conv });
}

export function markRead(threadId: string): void {
  const store = getStore();
  const conv = store.conversations.get(threadId);
  if (conv) conv.unread = 0;
}
