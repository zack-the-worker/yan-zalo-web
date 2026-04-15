// Shared types for chat messages used in both server and client
export type ThreadType = "User" | "Group";

export type MediaType = "sticker" | "image" | "video" | "file" | "poll";

export interface MessageReaction {
  icon: string; // Zalo shortcode e.g. "/-heart"
  senderIds: string[];
  senderNames: string[];
}

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
  cliMsgId?: string; // client-side message ID (needed for addReaction)
  pollId?: number; // poll ID for poll messages
  reactions?: MessageReaction[];
}

export interface Conversation {
  id: string;
  type: ThreadType;
  name: string;
  avatar?: string;
  lastMessage?: ChatMessage;
  unread: number;
}

interface SessionStore {
  messages: Map<string, ChatMessage[]>;
  conversations: Map<string, Conversation>;
}

declare global {
  // eslint-disable-next-line no-var
  var __messageStore: Map<string, SessionStore> | undefined;
}

function getStore(sessionId: string): SessionStore {
  if (!global.__messageStore) global.__messageStore = new Map();
  if (!global.__messageStore.has(sessionId)) {
    global.__messageStore.set(sessionId, { messages: new Map(), conversations: new Map() });
  }
  return global.__messageStore.get(sessionId)!;
}

const MAX_PER_THREAD = 200;

export function storeMessage(msg: ChatMessage, sessionId: string): void {
  const store = getStore(sessionId);
  const msgs = store.messages.get(msg.threadId) ?? [];
  if (msgs.some((m) => m.id === msg.id)) return;
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

export function getMessages(threadId: string, sessionId: string): ChatMessage[] {
  return getStore(sessionId).messages.get(threadId) ?? [];
}

export function getConversations(sessionId: string): Conversation[] {
  return Array.from(getStore(sessionId).conversations.values()).sort(
    (a, b) => (b.lastMessage?.ts ?? 0) - (a.lastMessage?.ts ?? 0)
  );
}

export function upsertConversation(conv: Partial<Conversation> & { id: string }, sessionId: string): void {
  const store = getStore(sessionId);
  const existing = store.conversations.get(conv.id) ?? {
    id: conv.id,
    type: conv.type ?? "User",
    name: conv.name ?? conv.id,
    unread: 0,
  };
  store.conversations.set(conv.id, { ...existing, ...conv });
}

export function markRead(threadId: string, sessionId: string): void {
  const store = getStore(sessionId);
  const conv = store.conversations.get(threadId);
  if (conv) conv.unread = 0;
}

export function updateMessageReaction(
  threadId: string,
  msgId: string,
  icon: string,
  senderId: string,
  senderName: string,
  sessionId: string
): void {
  const msgs = getStore(sessionId).messages.get(threadId);
  if (!msgs) return;
  const msg = msgs.find((m) => m.id === msgId);
  if (!msg) return;
  if (!msg.reactions) msg.reactions = [];
  const existing = msg.reactions.find((r) => r.icon === icon);
  if (existing) {
    if (!existing.senderIds.includes(senderId)) {
      existing.senderIds.push(senderId);
      existing.senderNames.push(senderName);
    }
  } else {
    msg.reactions.push({ icon, senderIds: [senderId], senderNames: [senderName] });
  }
}
