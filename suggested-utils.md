
## 🤖 Tự động hóa (Zalo chính thức không có)

| API | Tiện ích gợi ý |
|-----|---------------|
| `createAutoReply` / `updateAutoReply` / `deleteAutoReply` | **Bot tự động trả lời**: cài keyword → auto-reply theo rule (VD: "giá?" → gửi bảng giá) |
| `addQuickMessage` / `getQuickMessageList` | **Thư viện tin nhắn mẫu** (template) — chọn 1 click thay vì gõ lại |
| `sendMessage` (loop) | **Broadcast**: gửi cùng 1 tin nhắn đến nhiều bạn bè / nhóm cùng lúc |
| `createReminder` + `sendMessage` | **Tin nhắn lên lịch** — Zalo không có scheduled messages! |

---

## 📊 Phân tích & nghiên cứu (Zalo ẩn thông tin này)

| API | Tiện ích gợi ý |
|-----|---------------|
| `lastOnline` | **Xem giờ hoạt động cuối** của bất kỳ ai (kể cả người không phải bạn bè — Zalo ẩn cái này) |
| `group_event` listener | **Log thành viên vào/ra nhóm** theo thời gian thực + xuất báo cáo |
| `getGroupMembersInfo` (nhiều nhóm) | **So sánh thành viên chéo nhóm**: ai đang ở cả nhóm A lẫn nhóm B |
| `getFriendRecommendations` | Xem Zalo đang gợi ý kết bạn ai / lý do gợi ý |

---

## 🛠️ Quản lý nhóm hàng loạt (Zalo chỉ cho làm từng cái)

| API | Tiện ích gợi ý |
|-----|---------------|
| `getPendingGroupMembers` + `reviewPendingMemberRequest` | **Duyệt/từ chối hàng loạt** — lọc theo tên, filter spam |
| `addGroupBlockedMember` / `getGroupBlockedMember` | **Dashboard block list** với tìm kiếm |
| `addGroupDeputy` / `removeGroupDeputy` | Quản lý phó nhóm hàng loạt |
| `inviteUserToGroups` | Mời 1 user vào **nhiều nhóm cùng lúc** |
| `removeUserFromGroup` (loop) | Kick nhiều thành viên cùng lúc theo danh sách |

---

## 🏷️ CRM cá nhân (Zalo UI quá kém)

| API | Tiện ích gợi ý |
|-----|---------------|
| `updateLabels` / `getLabels` | **Gắn tag / nhãn** cho conversation với giao diện kéo thả |
| `changeFriendAlias` / `getAliasList` | Quản lý **nickname** bạn bè hàng loạt (export/import Excel) |
| `setMute` / `getMute` | **Mute hàng loạt** — tắt thông báo tất cả nhóm trừ danh sách whitelist |
| `setPinnedConversations` | Ghim nhiều cuộc trò chuyện cùng lúc |

---

## 🔍 Tìm kiếm & tra cứu

| API | Tiện ích gợi ý |
|-----|---------------|
| `findUser` | **Tra số điện thoại** → xem có Zalo không, thông tin public |
| `getRelatedFriendGroup` | Xem bạn có **nhóm chung** nào với người đó |
| `parseLink` | Preview link trước khi gửi |

---

## 🗳️ Tính năng còn thiếu trong app hiện tại

| API | Status |
|-----|--------|
| `createPoll` / `getPollDetail` / `lockPoll` | Tạo bình chọn ngay trong app |
| `addReaction` | Thả reaction vào tin nhắn |
| `forwardMessage` | Chuyển tiếp tin nhắn |
| `sendVoice` / `sendVideo` | Gửi file âm thanh/video |
| `uploadAttachment` | Gửi file đính kèm |
| `reaction` listener | Hiển thị reaction real-time trong chat |

---

**Đề xuất ưu tiên triển khai** (impact cao + độc đáo nhất):

1. 🥇 **Auto-reply bot** (`createAutoReply`) — cực kỳ hữu ích, Zalo cá nhân không có
2. 🥈 **lastOnline tracker** — thông tin Zalo ẩn, rất được quan tâm  
3. 🥉 **Broadcast / scheduled message** — gửi hàng loạt theo lịch
4. **Cross-group member analysis** — so sánh danh sách thành viên giữa các nhóm

Bạn muốn triển khai tính năng nào trước? 

