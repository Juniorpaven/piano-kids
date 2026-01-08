# Kế Hoạch Giai Đoạn 2: Mở Rộng GameFi "Đảo Kẹo Ngọt"

## 1. Mục Tiêu

Bổ sung chế độ chơi mới **"Touch Mode"** (Chơi trên màn hình) song song với chế độ **"Mic Mode"** (Chơi với đàn thật) hiện có.

- **Mic Mode**: Dành cho bé tập đàn thật.
- **Touch Mode**: Dành cho bé tập cảm âm, phản xạ và giải trí (GameFi) ngay trên điện thoại/iPad.

## 2. Kiến Trúc Mới

Refactor `App.jsx` thành **Main Menu** điều hướng:

- **Button 1**: "Thám Hiểm Rừng Xanh" (Mic Mode - Existing).
- **Button 2**: "Đảo Kẹo Ngọt" (Touch Mode - New).

## 3. Chi Tiết Thực Hiện "Touch Mode" (Đảo Kẹo Ngọt)

### 3.1. Công Nghệ

- **Audio**: `Tone.js` (PolySynth) thay cho Web Audio API thô để có âm thanh Piano hay hơn.
- **Input**: Touch/Click events.
- **Storage**: `localStorage` để lưu "Xu Kẹo" (Golden Notes).

### 3.2. Tính Năng GameFi

1. **Bàn Phím Kẹo Dẻo (Jelly Keys)**:
    - 7 Phím (C, D, E, F, G, A, B).
    - Màu sắc cầu vồng: Đỏ, Cam, Vàng, Lục, Lam, Chàm, Tím.
    - Hiệu ứng: Nảy (Bounce) + Paricle (Pháo hoa) khi nhấn.

2. **Mini-Games**:
    - **Game 1: Cho Thú Ăn (Note Identity)**:
        - Hiện Thú + Nốt (ví dụ: Mèo E).
        - Bé bấm phím E -> Thú ăn & Nhảy.
    - **Game 2: Tự Do (Free Play)**:
        - Bé đàn tự do, mỗi nốt đúng nhịp/hợp âm được cộng xu.

3. **Hệ Thống Pet & Shop**:
    - Hiển thị số Xu Kẹo.
    - Nút "Cửa Hàng": Mua mũ/kính cho Rùa, Nai, Mèo (Chỉ thay đổi visual đơn giản).

4. **Wellbeing (Giờ đi ngủ)**:
    - Timer 15 phút.
    - Hết giờ -> Overlay "Các bạn thú đi ngủ rồi" -> Chặn chơi.

## 4. Lộ Trình Triển Khai

- [x] Cài đặt `tone`.
- [ ] **Bước 1**: Tách code `App.jsx` hiện tại sang `MicGame.jsx`.
- [ ] **Bước 2**: Tạo `App.jsx` mới làm Menu chính.
- [ ] **Bước 3**: Tạo `TouchGame.jsx` (Màn hình chính của chế độ mới).
- [ ] **Bước 4**: Xây dựng Component `VirtualPiano` (Bàn phím ảo).
- [ ] **Bước 5**: Ghép Logic Game "Cho Thú Ăn".
- [ ] **Bước 6**: Thêm Shop & Pet Inventory.
