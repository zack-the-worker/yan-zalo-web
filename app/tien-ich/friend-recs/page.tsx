"use client";

import { useState } from "react";
import { Users, RefreshCw } from "lucide-react";
import type { FriendRecInfo, FriendRecsResponse } from "@/types/utilities";

const RECOMM_TYPE_LABELS: Record<number, string> = {
  1: "Gợi ý kết bạn",
  2: "Đã gửi lời mời",
};

const SUGGEST_WAY_LABELS: Record<number, string> = {
  0: "Bạn bè chung",
  1: "Cùng nhóm",
  2: "Số điện thoại",
  3: "Đã từng nhắn tin",
};

export default function FriendRecsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FriendRecsResponse | null>(null);
  const [tab, setTab] = useState<1 | 2>(1);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/utilities/friend-recs");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Lỗi không xác định");
        return;
      }
      setData(json as FriendRecsResponse);
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const items = data?.recommItems ?? [];
  const filtered = items.filter((i) => i.dataInfo.recommType === tab);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">👥 Gợi ý kết bạn</h1>
      <p className="text-sm text-gray-500 mb-6">
        Xem danh sách Zalo đang gợi ý và lý do gợi ý — thông tin này bị ẩn trên
        giao diện chính thức.
      </p>

      {!data ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mb-4 mx-auto" />
          <p className="text-gray-500 text-sm mb-5">
            Nhấn nút bên dưới để tải danh sách gợi ý kết bạn hiện tại
          </p>
          <button
            onClick={handleLoad}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? "Đang tải..." : "Tải danh sách"}
          </button>
          {error && <p className="mt-3 text-red-500 text-sm">⚠️ {error}</p>}
        </div>
      ) : (
        <>
          {/* Header + reload */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {([1, 2] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-sm px-4 py-1.5 rounded-lg transition-colors font-medium ${
                    tab === t
                      ? "bg-white shadow-sm text-gray-800"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {RECOMM_TYPE_LABELS[t]} (
                  {items.filter((i) => i.dataInfo.recommType === t).length})
                </button>
              ))}
            </div>
            <button
              onClick={handleLoad}
              disabled={loading}
              className="text-sm border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              {loading ? "Đang tải lại..." : "Tải lại"}
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-gray-400 text-sm">Không có gợi ý nào trong danh mục này</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(({ dataInfo: u }) => (
                <div
                  key={u.userId}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3"
                >
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.displayName}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-12 h-12 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-500 font-bold">
                        {u.displayName?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {u.displayName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      @{u.zaloName}
                    </p>

                    {/* Recommend reason */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {u.recommInfo?.suggestWay !== undefined && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {SUGGEST_WAY_LABELS[u.recommInfo.suggestWay] ??
                            `Nguồn ${u.recommInfo.suggestWay}`}
                        </span>
                      )}
                      {u.recommInfo?.message && (
                        <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                          {u.recommInfo.message}
                        </span>
                      )}
                      {u.isSeenFriendReq && (
                        <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">
                          Đã xem lời mời
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
