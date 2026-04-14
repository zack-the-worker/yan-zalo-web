"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Clock, ClipboardList, Users, UserSearch, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Tool {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
}

const TOOLS: Tool[] = [
  {
    href: "/tien-ich/scan-group-members",
    icon: Search,
    label: "Quét thành viên nhóm",
    desc: "Lấy toàn bộ danh sách thành viên + xuất CSV/JSON",
  },
  {
    href: "/tien-ich/last-online",
    icon: Clock,
    label: "Tra cứu giờ online",
    desc: "Xem hoạt động cuối của bất kỳ ai, kể cả người lạ",
  },
  {
    href: "/tien-ich/group-events",
    icon: ClipboardList,
    label: "Log sự kiện nhóm",
    desc: "Theo dõi vào/ra nhóm theo thời gian thực",
  },
  {
    href: "/tien-ich/friend-recs",
    icon: Users,
    label: "Gợi ý kết bạn",
    desc: "Xem Zalo đang gợi ý ai cho bạn và lý do",
  },
  {
    href: "/tien-ich/find-user",
    icon: UserSearch,
    label: "Tra cứu tài khoản",
    desc: "Tìm thông tin công khai Zalo qua số điện thoại",
  },
  {
    href: "/tien-ich/related-friend-group",
    icon: Users2,
    label: "Nhóm chung",
    desc: "Xem bạn có nhóm nào chung với người khác",
  },
];

export default function TienIchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.status !== "logged_in") router.replace("/login");
        else setChecked(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">Z</span>
            </div>
            <span className="font-bold text-gray-800">YAN Zalo</span>
          </div>
          <nav className="flex gap-1 items-center">
            <Link
              href="/chat"
              className="text-sm px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Chat
            </Link>
            <span className="text-sm px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-medium">
              Tiện ích
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/zack-the-worker/yan-zalo-web"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="GitHub"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.071 1.532 1.032 1.532 1.032.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2 mt-1">
              Danh sách tiện ích
            </p>
            <nav className="space-y-1">
              {TOOLS.map((tool) => {
                const isActive = pathname === tool.href;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? "bg-blue-50"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <tool.icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isActive ? "text-blue-700" : "text-gray-800"
                        }`}
                      >
                        {tool.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                        {tool.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
