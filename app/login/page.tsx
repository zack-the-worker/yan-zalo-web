"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

type Status = "idle" | "loading" | "qr_generated" | "logged_in" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQRImage = async () => {
    try {
      const res = await fetch("/api/auth/qr");
      if (res.ok) {
        const data = await res.json();
        setQrDataUrl(`data:image/png;base64,${data.image}`);
      } else {
        // QR not ready yet, retry
        setTimeout(loadQRImage, 800);
      }
    } catch {
      setTimeout(loadQRImage, 800);
    }
  };

  const startLogin = async () => {
    setStatus("loading");
    setQrDataUrl(null);
    try {
      const res = await fetch("/api/auth/start-qr", { method: "POST" });
      const data = await res.json();
      if (data.status === "logged_in") {
        await storeSessionLocally();
        router.replace("/chat");
        return;
      }
      setStatus("qr_generated");
      loadQRImage();
    } catch {
      setStatus("error");
    }
  };

  const storeSessionLocally = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("zalo_session", JSON.stringify(data));
      }
    } catch {
      // ignore — user will need to scan QR again next time
    }
  };

  const regenerateQR = async () => {
    setStatus("loading");
    setQrDataUrl(null);
    try {
      await fetch("/api/auth/regenerate-qr", { method: "POST" });
      setStatus("qr_generated");
      loadQRImage();
    } catch {
      setStatus("error");
    }
  };

  // Poll for login status
  useEffect(() => {
    if (status !== "qr_generated") return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        if (data.status === "logged_in") {
          clearInterval(pollRef.current!);
          await storeSessionLocally();
          router.replace("/chat");
        } else if (data.status === "error") {
          clearInterval(pollRef.current!);
          setStatus("error");
        }
      } catch {
        // network error, keep polling
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, router]);

  // Check if already logged in on mount; try localStorage restore if not
  useEffect(() => {
    const tryAutoRestore = async () => {
      const statusRes = await fetch("/api/auth/status");
      const statusData = await statusRes.json();
      if (statusData.status === "logged_in") {
        router.replace("/chat");
        return;
      }
      const stored = localStorage.getItem("zalo_session");
      if (stored) {
        try {
          const res = await fetch("/api/auth/restore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: stored,
          });
          const d = await res.json();
          if (d.status === "logged_in") {
            router.replace("/chat");
            return;
          }
        } catch {
          // ignore
        }
        localStorage.removeItem("zalo_session");
      }
    };
    tryAutoRestore().catch(() => {});
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        {/* Logo / Title */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">YAN Zalo</h1>
          <p className="text-gray-500 text-sm mt-1">
            Đăng nhập bằng QR Code Zalo
          </p>
        </div>

        {/* QR area */}
        {status === "idle" && (
          <button
            onClick={startLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Tạo mã QR đăng nhập
          </button>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Đang tạo mã QR...</p>
          </div>
        )}

        {status === "qr_generated" && (
          <div className="flex flex-col items-center gap-4">
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Zalo QR Code"
                  width={220}
                  height={220}
                  className="block"
                />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Mở <strong>Zalo</strong> → Quét mã QR này để đăng nhập
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-500">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Đang chờ quét...
            </div>
            <button
              onClick={regenerateQR}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Mã QR không khả dụng? Tạo lại
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <p className="text-red-600 text-sm">
              Đã xảy ra lỗi. Vui lòng thử lại.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Warning */}
        <p className="text-xs text-gray-400 mt-6">
          ⚠️ Sử dụng unofficial API — có thể vi phạm ToS của Zalo
        </p>
      </div>
    </div>
  );
}
