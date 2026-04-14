"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Inbox } from "lucide-react";
import type { GroupEventLog } from "@/lib/zalo";

const EVENT_TYPE_LABELS: Record<string, string> = {
  join: "Tham gia",
  leave: "Rời nhóm",
  remove_member: "Bị kick",
  block_member: "Bị chặn",
  join_request: "Xin vào nhóm",
  add_admin: "Thêm phó nhóm",
  remove_admin: "Xóa phó nhóm",
  update_setting: "Cập nhật cài đặt",
  update: "Cập nhật nhóm",
  update_avatar: "Đổi ảnh nhóm",
  new_link: "Link nhóm mới",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  join: "bg-green-100 text-green-700",
  leave: "bg-gray-100 text-gray-600",
  remove_member: "bg-red-100 text-red-600",
  block_member: "bg-red-100 text-red-700",
  join_request: "bg-yellow-100 text-yellow-700",
  add_admin: "bg-blue-100 text-blue-700",
  remove_admin: "bg-orange-100 text-orange-700",
};

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: "/api/socketio", transports: ["websocket", "polling"] });
  }
  return socket;
}

export default function GroupEventsPage() {
  const [events, setEvents] = useState<GroupEventLog[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const socketRef = useRef<Socket | null>(null);

  // Load existing events on mount
  useEffect(() => {
    fetch("/api/utilities/group-events")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.events)) setEvents(d.events);
      })
      .catch(() => {});
  }, []);

  // Socket real-time
  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    const handler = (event: GroupEventLog) => {
      setEvents((prev) => [event, ...prev]);
    };

    s.on("group_event", handler);
    s.on("connect", () => setIsLive(true));
    s.on("disconnect", () => setIsLive(false));
    if (s.connected) setIsLive(true);

    return () => {
      s.off("group_event", handler);
    };
  }, []);

  const handleClear = async () => {
    await fetch("/api/utilities/group-events", { method: "DELETE" });
    setEvents([]);
  };

  const handleExportCsv = () => {
    const rows = [
      ["Thời gian", "Loại sự kiện", "Nhóm", "Thành viên"],
      ...events.map((e) => [
        new Date(e.ts).toLocaleString("vi-VN"),
        EVENT_TYPE_LABELS[e.type] ?? e.type,
        e.groupName || e.groupId,
        e.memberNames.join("; ") || e.memberIds.join("; "),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `group-events-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = events.filter((e) => {
    if (filterType && e.type !== filterType) return false;
    if (
      filterGroup &&
      !e.groupName.toLowerCase().includes(filterGroup.toLowerCase()) &&
      !e.groupId.includes(filterGroup)
    )
      return false;
    return true;
  });

  const uniqueTypes = [...new Set(events.map((e) => e.type))];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-gray-800">📋 Log sự kiện nhóm</h1>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              isLive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            {isLive ? "Live" : "Ngắt kết nối"}
          </span>
          <button
            onClick={handleExportCsv}
            disabled={events.length === 0}
            className="text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleClear}
            disabled={events.length === 0}
            className="text-sm border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors"
          >
            Xóa log
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Theo dõi thành viên vào/ra nhóm theo thời gian thực. Log tồn tại cho đến
        khi server khởi động lại hoặc bạn xóa thủ công.
      </p>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        >
          <option value="">Tất cả loại sự kiện</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABELS[t] ?? t}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          placeholder="Lọc theo tên nhóm..."
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 flex-1 max-w-xs"
        />
        <span className="text-sm text-gray-400 self-center">
          {filtered.length} sự kiện
        </span>
      </div>

      {/* Event table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mb-3 mx-auto" />
          <p className="text-gray-400 text-sm">
            {events.length === 0
              ? "Chưa có sự kiện nào. Đang chờ sự kiện từ các nhóm..."
              : "Không có sự kiện khớp với bộ lọc"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Thời gian
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Sự kiện
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Nhóm
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Thành viên
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(event.ts).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        EVENT_TYPE_COLORS[event.type] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {EVENT_TYPE_LABELS[event.type] ?? event.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                    {event.groupName || (
                      <span className="text-gray-400">{event.groupId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[250px]">
                    {event.memberNames.length > 0 ? (
                      <span>{event.memberNames.join(", ")}</span>
                    ) : event.memberIds.length > 0 ? (
                      <span className="text-gray-400 text-xs">
                        {event.memberIds.join(", ")}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
