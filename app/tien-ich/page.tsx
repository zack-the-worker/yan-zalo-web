import { Wrench } from "lucide-react";

export default function TienIchPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
      <Wrench className="w-12 h-12 text-gray-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Khu vực Tiện ích</h2>
      <p className="text-gray-400 text-sm max-w-xs">
        Chọn một tiện ích từ thanh bên để bắt đầu. Các tính năng này không có
        trong ứng dụng Zalo chính thức.
      </p>
    </div>
  );
}
