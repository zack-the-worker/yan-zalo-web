import { Zalo, API, ThreadType, LoginQRCallbackEventType } from "zca-js";
import { getSocketServer } from "./socketServer";
import { storeMessage, getMessages, updateMessageReaction, type ChatMessage } from "./messageStore";

export type LoginStatus = "idle" | "qr_generated" | "logged_in" | "error";

// ── Group Event Log ────────────────────────────────────────────────────────────
export interface GroupEventLog {
  id: string;
  type: string;
  groupId: string;
  groupName: string;
  memberNames: string[];
  memberIds: string[];
  ts: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __groupEvents: GroupEventLog[] | undefined;
}

const MAX_GROUP_EVENTS = 500;

function getEventStore(): GroupEventLog[] {
  if (!global.__groupEvents) global.__groupEvents = [];
  return global.__groupEvents;
}

export function getGroupEvents(): GroupEventLog[] {
  return [...getEventStore()];
}

export function clearGroupEvents(): void {
  global.__groupEvents = [];
}

interface ZaloState {
  status: LoginStatus;
  api: API | null;
  error: string | null;
  qrImageBase64: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __zaloState: ZaloState | undefined;
  // __groupEvents is declared above
}

function getState(): ZaloState {
  if (!global.__zaloState) {
    global.__zaloState = { status: "idle", api: null, error: null, qrImageBase64: null };
  }
  return global.__zaloState;
}

export function getLoginStatus(): LoginStatus {
  return getState().status;
}

export function getZaloApi(): API | null {
  return getState().api;
}

export function isLoggedIn(): boolean {
  return getState().status === "logged_in";
}

export function getQRImageBase64(): string | null {
  return getState().qrImageBase64;
}

export function getSessionForClient(): { imei: string; userAgent: string; cookies: unknown[] } | null {
  const state = getState();
  if (state.status !== "logged_in" || !state.api) return null;
  try {
    const ctx = state.api.getContext();
    const cookieJar = state.api.getCookie();
    const cookies = (cookieJar.toJSON() as { cookies: unknown[] }).cookies;
    return { imei: ctx.imei, userAgent: ctx.userAgent, cookies };
  } catch {
    return null;
  }
}

export async function restoreFromSession(
  data: { imei: string; userAgent: string; cookies: unknown[] }
): Promise<boolean> {
  const state = getState();
  if (state.status === "logged_in") return true;
  try {
    const { imei, userAgent, cookies } = data;
    if (!imei || !userAgent || !Array.isArray(cookies)) return false;
    const zalo = new Zalo({ selfListen: true, checkUpdate: false, logging: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api: API = await zalo.login({ cookie: cookies as any, imei, userAgent });
    state.api = api;
    state.status = "logged_in";
    state.error = null;
    api.listener.start();
    wireMessageListener(api);
    console.log("[zalo] Restored session from client.");
    return true;
  } catch (err) {
    console.error("[zalo] Session restore failed:", err);
    return false;
  }
}

export async function startQRLogin(): Promise<void> {
  const state = getState();

  if (state.status === "logged_in") return;
  if (state.status === "qr_generated") return;

  state.status = "qr_generated";
  state.error = null;

  const zalo = new Zalo({
    selfListen: true,
    checkUpdate: false,
    logging: false,
  });

  // Run login in background — resolves when user scans QR
  zalo
    .loginQR({}, (event) => {
      if (event.type === LoginQRCallbackEventType.QRCodeGenerated) {
        state.qrImageBase64 = event.data.image;
      }
    })
    .then((api: API) => {
      state.api = api;
      state.status = "logged_in";
      state.qrImageBase64 = null;
      api.listener.start();
      wireMessageListener(api);
    })
    .catch((err: Error) => {
      state.status = "error";
      state.error = err?.message ?? "Unknown error";
    });
}

// ai-start
export async function regenerateQRLogin(): Promise<void> {
  resetLogin();
  await startQRLogin();
}

export function resetLogin(): void {
// ai-end
  const state = getState();
  if (state.api) {
    try {
      state.api.listener.stop();
    } catch {
      // ignore
    }
  }
  state.status = "idle";
  state.api = null;
  state.error = null;
  state.qrImageBase64 = null;
}

export function wireMessageListener(api: API): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api.listener.on("message", async (message: any) => {
    try {
      const isGroup = message.type === ThreadType.Group;
      const data = message.data ?? {};

      const ownId = api.getOwnId();
      const fromId: string = data.uidFrom ?? data.senderId ?? ownId ?? "";

      // Detect sticker messages (msgType === "chat.sticker")
      let content: string;
      let mediaType: ChatMessage["mediaType"];
      let mediaUrl: string | undefined;

      if (data.msgType === "chat.sticker" && data.content && typeof data.content === "object") {
        const stickerContent = data.content as { id?: number; cateId?: number; type?: number };
        content = "[Sticker]";
        mediaType = "sticker";
        // Resolve sticker URL from API
        const stickerId = stickerContent.id;
        if (stickerId) {
          try {
            const details = await api.getStickersDetail(stickerId);
            const detail = details?.[0];
            if (detail) {
              mediaUrl = detail.stickerWebpUrl || detail.stickerUrl || undefined;
            }
          } catch {
            // URL resolution failed; show placeholder
          }
        }
      } else {
        content =
          typeof data.content === "string"
            ? data.content
            : data.content?.msg ?? "[media]";
      }

      const chatMsg: ChatMessage = {
        id: String(data.msgId ?? data.cliMsgId ?? Date.now()),
        threadId: message.threadId,
        threadType: isGroup ? "Group" : "User",
        fromId,
        fromName: data.dName ?? data.displayName ?? fromId,
        content,
        ts: Number(data.ts ?? Date.now()),
        isSelf: message.isSelf ?? false,
        cliMsgId: data.cliMsgId ? String(data.cliMsgId) : undefined,
        ...(mediaType && { mediaType }),
        ...(mediaUrl && { mediaUrl }),
      };

      storeMessage(chatMsg);

      const io = getSocketServer();
      if (io) {
        io.emit("message", chatMsg);
      }
    } catch (err) {
      console.error("[zalo] message wiring error:", err);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api.listener.on("group_event", (event: any) => {
    try {
      const { type, data } = event;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base = data as any;

      const log: GroupEventLog = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: String(type),
        groupId: base.groupId ?? "",
        groupName: base.groupName ?? "",
        memberNames: Array.isArray(base.updateMembers)
          ? base.updateMembers.map((m: { dName: string }) => m.dName)
          : [],
        memberIds: Array.isArray(base.updateMembers)
          ? base.updateMembers.map((m: { id: string }) => m.id)
          : [],
        ts: Date.now(),
      };

      const store = getEventStore();
      store.unshift(log);
      if (store.length > MAX_GROUP_EVENTS) store.length = MAX_GROUP_EVENTS;

      const io = getSocketServer();
      if (io) {
        io.emit("group_event", log);
      }
    } catch (err) {
      console.error("[zalo] group_event wiring error:", err);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api.listener.on("reaction", (event: any) => {
    try {
      const data = event.data ?? {};
      const threadId: string = event.threadId ?? data.idTo ?? "";
      const msgId: string = String(data.msgId ?? data.cliMsgId ?? "");
      const icon: string = data.content?.rIcon ?? "";
      const senderId: string = String(data.uidFrom ?? "");
      const senderName: string = data.dName ?? senderId;

      if (!threadId || !msgId || !icon) return;

      updateMessageReaction(threadId, msgId, icon, senderId, senderName);

      const io = getSocketServer();
      if (io) {
        io.emit("message_reaction", { threadId, msgId, icon, senderId, senderName });
      }
    } catch (err) {
      console.error("[zalo] reaction wiring error:", err);
    }
  });
}
