"use client";

import { useState } from "react";
import type { UserInfo, LastOnlineResult } from "@/types/utilities";

function formatLastOnline(ts: number): string {
  if (!ts) return "Không xác định";
  const now = Date.now();
  const diff = Math.floor((now - ts * 1000) / 1000); // ts is in seconds

  if (diff < 60) return "Vừa mới online";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;

  const date = new Date(ts * 1000);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LastOnlinePage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [lastOnline, setLastOnline] = useState<LastOnlineResult | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    setUser(null);
    setLastOnline(null);

    try {
      // Step 1: find user by phone to get uid
      const userRes = await fetch(
        `/api/utilities/find-user?phone=${encodeURIComponent(phone.trim())}`
      );
      const userData = await userRes.json();
      if (!userRes.ok) {
        setError(userData.error ?? "Không tìm thấy người dùng");
        return;
      }
      setUser(userData as UserInfo);

      // Step 2: get last online using uid
      const onlineRes = await fetch(
        `/api/utilities/last-online?uid=${encodeURIComponent(userData.uid)}`
      );
      const onlineData = await onlineRes.json();
      if (!onlineRes.ok) {
        setError(onlineData.error ?? "Không lấy được thông tin online");
        return;
      }
      setLastOnline(onlineData as LastOnlineResult);
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">
        🕐 Tra cứu giờ online
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Xem lần cuối người dùng online trên Zalo. Nếu người dùng đã bật ẩn
        trạng thái, thời gian sẽ không hiển thị được.
      </p>

      {/* Search form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 max-w-lg">
        <form onSubmit={handleLookup} className="flex gap-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Nhập số điện thoại (VD: 0912345678)"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium px-5 py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Đang tìm..." : "Tra cứu"}
          </button>
        </form>

        {error && <p className="mt-3 text-red-500 text-sm">⚠️ {error}</p>}
      </div>

      {/* Result card */}
      {user && lastOnline && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-lg">
          {/* User info */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.display_name}
                width={56}
                height={56}
                className="rounded-full object-cover w-14 h-14"
              />
            ) : (
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-500 text-xl font-bold">
                  {user.display_name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}
            <div>
              <p className="font-bold text-gray-800 text-base">
                {user.display_name}
              </p>
              <p className="text-sm text-gray-400">@{user.zalo_name}</p>
              {user.status && (
                <p className="text-xs text-gray-400 mt-0.5 italic">
                  &ldquo;{user.status}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Last online */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Ẩn trạng thái</span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  lastOnline.settings?.show_online_status
                    ? "bg-green-100 text-green-600"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {lastOnline.settings?.show_online_status ? "Hiển thị" : "Đã ẩn"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Hoạt động cuối</span>
              {lastOnline.lastOnline ? (
                <span className="text-sm font-semibold text-gray-800">
                  {formatLastOnline(lastOnline.lastOnline)}
                </span>
              ) : (
                <span className="text-sm text-orange-500 font-medium">
                  {lastOnline.settings?.show_online_status === false
                    ? "Bị ẩn bởi người dùng"
                    : "Không có dữ liệu"}
                </span>
              )}
            </div>
            {lastOnline.lastOnline > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Thời gian chính xác</span>
                <span className="text-xs text-gray-400">
                  {new Date(lastOnline.lastOnline * 1000).toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
