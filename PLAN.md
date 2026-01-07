# Kế Hoạch Phát Triển "Piano Kids"

## 1. Phân Tích Hiện Trạng (Musicca Reference)
**Musicca.com/vi/bai-tap** cung cấp hệ thống bài tập lý thuyết âm nhạc chuẩn mực nhưng mang tính học thuật cao:
- **Cấu trúc**: Phân chia theo module lý thuyết (Nốt, Nhịp, Quãng, Hợp âm).
- **Tương tác**: Click chuột hoặc nhấn phím máy tính.
- **Hạn chế với trẻ 4 tuổi**:
  - Giao diện nhiều chữ, ít hình ảnh sinh động.
  - Yêu cầu đọc hiểu.
  - Không hỗ trợ tương tác với nhạc cụ thật (Microphone).

## 2. Giải Pháp "Piano Kids" (Dành cho bé 4 tuổi)
Xây dựng web app biến việc học piano thành trò chơi "Giải cứu nốt nhạc" với giao diện hoạt hình rực rỡ.

### 2.1. Cốt Truyện & Nhân Vật
- **Nốt Đô (C)**: Rùa (Màu Đỏ/Cam) - Chậm, chắc.
- **Nốt Rê (D)**: Nai (Màu Vàng/Cam) - Nhanh nhẹn.
- **Nốt Mi (E)**: Mèo (Màu Vàng/Xanh) - Tinh nghịch.
- **Nốt Pha (F)**: Ếch (Màu Xanh lá).
- **Nốt Sol (G)**: Gấu (Màu Xanh dương).

### 2.2. Công Nghệ
- **Frontend**: React (Vite).
- **Xử lý âm thanh**: `ml5.js` (Pitch Detection) để nhận diện tiếng đàn thật qua Micro.
- **UI/Animation**: CSS3 Animations, có thể dùng SVG hoặc Canvas đơn giản.

## 3. Lộ Trình Thực Hiện (Roadmap)

### Giai đoạn 1: Foundations & Audio Engine (Tuần 1)
- [x] Khởi tạo dự án Vite.
- [ ] Thiết lập hệ thống Pitch Detection (dò tần số Hz để ra nốt).
- [ ] Calibrate (Chỉnh âm) để nhận diện đúng các nốt cơ bản (C4, D4, E4).

### Giai đoạn 2: Visuals & Characters (Tuần 2)
- [ ] Thiết kế nhân vật (Rùa, Nai, Mèo) bằng CSS/SVG.
- [ ] Tạo Animation: Jump, Dance khi nhận đúng nốt.
- [ ] Xây dựng "Khuông nhạc màu sắc" (Visual Staff) thay cho 5 dòng kẻ.

### Giai đoạn 3: Gameplay Loop (Tuần 3)
- [ ] Chế độ "Luyện tập": Hiện con vật -> Bé đánh nốt -> Thưởng kẹo.
- [ ] Chế độ "Phản xạ": Con vật chạy qua -> Đánh đúng để giữ lại.

### Giai đoạn 4: Polish & Test (Tuần 4)
- [ ] Tối ưu độ nhạy Micro.
- [ ] Thêm hiệu ứng âm thanh, nhạc nền vui nhộn.
