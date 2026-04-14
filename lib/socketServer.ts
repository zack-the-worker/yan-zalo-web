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
      console.log("[socket.io] client connected:", socket.id);
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
