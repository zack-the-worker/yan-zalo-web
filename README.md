# YAN Zalo

Ứng dụng web quản lý Zalo cá nhân — gửi tin nhắn, thả reaction, đính kèm file, tạo bình chọn, theo dõi thành viên nhóm và nhiều tiện ích khác, tất cả trong một giao diện duy nhất.

> **Không có backend riêng.** Toàn bộ giao tiếp với Zalo diễn ra trực tiếp từ server Next.js thông qua thư viện [**zca-js**](https://zca-js.tdung.com/vi/get-started/introduction.html) — một unofficial Zalo API client cho Node.js.

---

## ✨ Tính năng

### 💬 Chat
- Xem danh sách hội thoại (bạn bè & nhóm) theo thời gian thực qua Socket.io
- Gửi tin nhắn văn bản, emoji, sticker
- **Đính kèm file** — chọn file, xem preview, gửi kèm văn bản hoặc gửi riêng
- **Thả reaction** — rê chuột vào tin nhắn → thanh emoji xuất hiện → reaction hiển thị real-time
- **Chuyển tiếp tin nhắn** đến bất kỳ hội thoại nào
- **Tạo bình chọn** (cho nhóm) với nhiều lựa chọn, ẩn danh, chọn nhiều đáp án
- Tin nhắn mẫu (quick messages) — lưu sẵn, chọn 1 click

### 🛠️ Tiện ích
| Tiện ích | Mô tả |
|----------|-------|
| **Tra cứu người dùng** | Nhập số điện thoại → xem thông tin Zalo public |
| **Nhóm chung** | Xem bạn có nhóm chung nào với một người |
| **Preview link** | Paste URL → xem thumbnail, tiêu đề, mô tả trước khi gửi |
| **Giờ hoạt động cuối** | Xem lần cuối ai đó online (kể cả người không phải bạn bè) |
| **Gợi ý kết bạn** | Xem danh sách Zalo đang gợi ý kết bạn |
| **Log sự kiện nhóm** | Theo dõi thành viên vào/ra nhóm theo thời gian thực |
| **Quét thành viên nhóm** | Xuất danh sách thành viên ra file |

### 🔐 Xác thực
- Đăng nhập bằng QR code (quét bằng Zalo trên điện thoại)
- Session được lưu cục bộ — khởi động lại app không cần quét lại QR

---

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────┐
│              Trình duyệt (React)                │
│  Next.js App Router  +  Socket.io client        │
└────────────────────┬────────────────────────────┘
                     │ HTTP / WebSocket
┌────────────────────▼────────────────────────────┐
│          Next.js Server (server.ts)             │
│                                                 │
│  ┌──────────────┐    ┌──────────────────────┐  │
│  │  API Routes  │    │   Socket.io Server   │  │
│  │ /api/chat/*  │    │  (lib/socketServer)  │  │
│  │ /api/auth/*  │    └──────────┬───────────┘  │
│  │ /api/utilities/*             │               │
│  └──────┬───────┘               │               │
│         │                       │               │
│  ┌──────▼───────────────────────▼───────────┐  │
│  │              zca-js                      │  │
│  │  Unofficial Zalo API client (Node.js)   │  │
│  └──────────────────┬───────────────────────┘  │
└─────────────────────┼───────────────────────────┘
                      │ HTTPS / WebSocket
              ┌───────▼────────┐
              │  Zalo Servers  │
              └────────────────┘
```

**Không có database hay backend riêng.** Dữ liệu tin nhắn được lưu tạm trong bộ nhớ (`lib/messageStore.ts`) và session Zalo được lưu vào `data/session.json`.

---

## 🚀 Cài đặt & chạy

### Yêu cầu
- Node.js 20+
- npm

### Các bước

```bash
# 1. Clone repo
git clone https://github.com/zack-the-worker/yan-zalo-web.git
cd yan-zalo-web

# 2. Cài dependencies
npm install

# 3. Chạy development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) → đăng nhập bằng QR code Zalo.

---

## 🧪 Tests

```bash
npm test
```

Sử dụng **Vitest** + jsdom. Các API route, hooks và store đều có unit test.

---

## 🔧 Tech Stack

| Thành phần | Công nghệ |
|-----------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Real-time | Socket.io v4 |
| Zalo API | [**zca-js**](https://zca-js.tdung.com/vi/get-started/introduction.html) |
| Icons | Lucide React |
| Testing | Vitest + jsdom |

---

## ⚠️ Lưu ý

- Đây là công cụ cá nhân, không phải ứng dụng Zalo chính thức.
- `zca-js` là thư viện **unofficial** — sử dụng theo điều khoản của Zalo và tự chịu trách nhiệm.
- Không deploy lên môi trường public nếu không hiểu rõ hàm ý bảo mật.
- **Miễn trừ trách nhiệm:** Dự án này được cung cấp "nguyên trạng" (as-is) chỉ cho mục đích học tập và cá nhân. Tác giả không chịu trách nhiệm đối với bất kỳ hậu quả nào phát sinh từ việc cài đặt, sử dụng hoặc phân phối ứng dụng này, bao gồm nhưng không giới hạn ở việc vi phạm điều khoản dịch vụ của Zalo, mất dữ liệu, hoặc các thiệt hại khác.
