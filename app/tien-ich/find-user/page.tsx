"use client";

import { useState } from "react";
import Image from "next/image";
import type { UserInfo } from "@/types/utilities";

const GENDER_LABEL: Record<number, string> = {
  0: "Nữ",
  1: "Nam",
};

export default function FindUserPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    setUser(null);

    try {
      const res = await fetch(
        `/api/utilities/find-user?phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không tìm thấy người dùng");
        return;
      }
      setUser(data as UserInfo);
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">
        Tra cứu tài khoản Zalo
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Nhập số điện thoại để xem thông tin công khai của tài khoản Zalo.
      </p>

      {/* Search form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 max-w-lg">
        <form onSubmit={handleSearch} className="flex gap-3">
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
      {user && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-lg">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.display_name}
                width={64}
                height={64}
                className="rounded-full object-cover w-16 h-16 shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-blue-500 text-2xl font-bold">
                  {user.display_name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}

            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-base truncate">
                {user.display_name}
              </p>
              <p className="text-sm text-gray-400">@{user.zalo_name}</p>
              {user.status && (
                <p className="text-xs text-gray-400 mt-0.5 italic truncate">
                  &ldquo;{user.status}&rdquo;
                </p>
              )}
            </div>

            {user.gender !== undefined && GENDER_LABEL[user.gender] && (
              <span className="ml-auto shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-600">
                {GENDER_LABEL[user.gender]}
              </span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-xs text-gray-500">Có tài khoản Zalo</span>
            <span className="text-xs text-gray-300 ml-1">· UID: {user.uid}</span>
          </div>
        </div>
      )}
    </div>
  );
}
