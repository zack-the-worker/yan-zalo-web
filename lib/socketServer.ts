import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

declare global {
  // eslint-disable-next-line no-var
  var __ioServer: Server | undefined;
}

export function initSocketServer(httpServer: HttpServer): Server {
  if (!global.__ioServer) {
    global.__ioServer = new Server(httpServer, {
      path: "/api/socketio",
      cors: { origin: "*" },
    });

    global.__ioServer.on("connection", (socket) => {
      const cookieHeader = socket.handshake.headers.cookie ?? "";
      const match = cookieHeader.match(/(?:^|;\s*)zalo_sid=([^;]+)/);
      const sessionId = match ? decodeURIComponent(match[1]) : null;
      if (sessionId) socket.join(sessionId);
      console.log("[socket.io] client connected:", socket.id, "session:", sessionId ?? "none");
      socket.on("disconnect", () => {
        console.log("[socket.io] client disconnected:", socket.id);
      });
    });
  }
  return global.__ioServer;
}

export function getSocketServer(): Server | null {
  return global.__ioServer ?? null;
}
