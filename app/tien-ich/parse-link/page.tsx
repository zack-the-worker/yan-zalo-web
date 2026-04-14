"use client";

import { useState } from "react";
import Image from "next/image";
import type { ParseLinkResult } from "@/types/utilities";

export default function ParseLinkPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseLinkResult | null>(null);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/utilities/parse-link?url=${encodeURIComponent(url.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Không thể phân tích link");
        return;
      }
      setResult(data as ParseLinkResult);
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const preview = result?.data;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">Preview link</h1>
      <p className="text-sm text-gray-500 mb-6">
        Xem trước nội dung của một đường link trước khi gửi.
      </p>

      {/* Input form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 max-w-xl">
        <form onSubmit={handlePreview} className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Nhập URL (VD: https://example.com/article)"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium px-5 py-3 rounded-xl transition-colors text-sm shrink-0"
          >
            {loading ? "Đang tải..." : "Preview"}
          </button>
        </form>

        {error && <p className="mt-3 text-red-500 text-sm">⚠️ {error}</p>}
      </div>

      {/* Preview card */}
      {preview && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-xl">
          {preview.thumb && (
            <div className="relative w-full h-48 bg-gray-100">
              <Image
                src={preview.thumb}
                alt={preview.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <div className="p-5">
            {preview.title && (
              <h2 className="font-semibold text-gray-800 text-base mb-1 leading-snug">
                {preview.title}
              </h2>
            )}

            {preview.desc && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-3">
                {preview.desc}
              </p>
            )}

            {(preview.href || preview.src) && (
              <a
                href={preview.href || preview.src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline break-all"
              >
                {preview.href || preview.src}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
