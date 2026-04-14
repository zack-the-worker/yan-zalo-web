"use client";

import { useState } from "react";
import type { Member, GroupData } from "@/types/group";

const PAGE_SIZE_DISPLAY = 20;

export default function ScanGroupMembersPage() {
  const [groupLink, setGroupLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [apiPage, setApiPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [displayPage, setDisplayPage] = useState(1);

  const fetchMembers = async (link: string, page: number, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link, page }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Lỗi không xác định");
        return;
      }
      const data: GroupData = json.data;
      setGroupData(data);
      setHasMore(data.hasMoreMember === 1);
      setApiPage(page);

      if (append) {
        setAllMembers((prev) => [...prev, ...(data.currentMems ?? [])]);
      } else {
        setAllMembers(data.currentMems ?? []);
        setDisplayPage(1);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupLink.trim()) return;
    setGroupData(null);
    setAllMembers([]);
    fetchMembers(groupLink.trim(), 1, false);
  };

  const loadMore = () => {
    fetchMembers(groupLink.trim(), apiPage + 1, true);
  };

  const exportFile = (format: "csv" | "json") => {
    const url = `/api/members/export?link=${encodeURIComponent(groupLink)}&format=${format}`;
    window.open(url, "_blank");
  };

  const totalDisplayPages = Math.ceil(allMembers.length / PAGE_SIZE_DISPLAY);
  const displayedMembers = allMembers.slice(
    (displayPage - 1) * PAGE_SIZE_DISPLAY,
    displayPage * PAGE_SIZE_DISPLAY
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">
        🔍 Quét thành viên nhóm
      </h1>

      {/* Search form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <p className="text-sm text-gray-500 mb-4">
          Nhập link nhóm Zalo để lấy danh sách toàn bộ thành viên
        </p>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="url"
            value={groupLink}
            onChange={(e) => setGroupLink(e.target.value)}
            placeholder="https://zalo.me/g/xxxxxxx"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Đang tải..." : "Tìm kiếm"}
          </button>
        </form>
        {error && <p className="mt-3 text-red-500 text-sm">⚠️ {error}</p>}
      </div>

      {/* Group info + results */}
      {groupData && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Group header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {groupData.avt && (
                <img
                  src={groupData.avt}
                  alt={groupData.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="font-bold text-gray-800">{groupData.name}</h3>
                <p className="text-sm text-gray-500">
                  {groupData.totalMember} thành viên • {allMembers.length} đã
                  tải
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportFile("csv")}
                className="text-sm border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => exportFile("json")}
                className="text-sm border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>

          {/* Member list */}
          <div className="divide-y divide-gray-100">
            {displayedMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-3">
                <div className="flex-shrink-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.dName}
                      width={40}
                      height={40}
                      className="rounded-full object-cover w-10 h-10"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-medium">
                        {member.dName?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {member.dName || member.zaloName || "(Không tên)"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    @{member.zaloName} • ID: {member.id}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    member.accountStatus === 1
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {member.accountStatus === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>

          {/* Display pagination */}
          {totalDisplayPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setDisplayPage((p) => Math.max(1, p - 1))}
                disabled={displayPage === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                ← Trước
              </button>
              <span className="text-sm text-gray-600">
                Trang {displayPage}/{totalDisplayPages}
              </span>
              <button
                onClick={() =>
                  setDisplayPage((p) => Math.min(totalDisplayPages, p + 1))
                }
                disabled={displayPage === totalDisplayPages}
                className="px-3 py-1 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Tiếp →
              </button>
            </div>
          )}

          {/* Load more from API */}
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="text-sm text-blue-500 hover:text-blue-700 font-medium disabled:text-blue-300"
              >
                {loading ? "Đang tải thêm..." : "Tải thêm thành viên"}
              </button>
            </div>
          )}

          {!hasMore && allMembers.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-4">
              ✓ Đã tải tất cả {allMembers.length} thành viên
            </p>
          )}
        </div>
      )}
    </div>
  );
}
