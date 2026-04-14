"use client";

import { useState } from "react";
import Image from "next/image";
import type { UserInfo, RelatedGroupsEnriched } from "@/types/utilities";

export default function RelatedFriendGroupPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [result, setResult] = useState<RelatedGroupsEnriched | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    setUser(null);
    setResult(null);

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

      // Step 2: get common groups using uid
      const groupRes = await fetch(
        `/api/utilities/related-friend-group?uid=${encodeURIComponent(userData.uid)}`
      );
      const groupData = await groupRes.json();
      if (!groupRes.ok) {
        setError(groupData.error ?? "Không lấy được danh sách nhóm chung");
        return;
      }
      setResult(groupData as RelatedGroupsEnriched);
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">Nhóm chung</h1>
      <p className="text-sm text-gray-500 mb-6">
        Xem bạn đang có nhóm Zalo nào chung với một người khác.
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

      {/* User info card */}
      {user && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 max-w-lg">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.display_name}
                width={48}
                height={48}
                className="rounded-full object-cover w-12 h-12 shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-blue-500 text-lg font-bold">
                  {user.display_name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {user.display_name}
              </p>
              <p className="text-sm text-gray-400">@{user.zalo_name}</p>
            </div>

            {result && (
              <span className="ml-auto shrink-0 bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                {result.groups.length} nhóm chung
              </span>
            )}
          </div>
        </div>
      )}

      {/* Group list */}
      {result && (
        <div className="max-w-lg">
          {result.groups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
              Không có nhóm chung nào.
            </div>
          ) : (
            <div className="space-y-2">
              {result.groups.map(({ groupId, groupName }) => (
                <div
                  key={groupId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-3"
                >
                  <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-purple-500 text-sm font-bold">
                      {groupName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {groupName}
                    </p>
                    <p className="text-xs text-gray-400">{groupId}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
