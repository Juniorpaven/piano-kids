# Kế Hoạch Giai Đoạn 3: Hệ Thống Hợp Âm & "Siêu Năng Lượng"

## 1. Nâng Cấp Giao Diện Bàn Phím

- **Yêu cầu cũ**: Chỉ có phím trắng (C Major Scale).
- **Yêu cầu mới**: Bàn phím Piano chuẩn (Có phím đen).
  - Layout: C-D-E-F-G-A-B (Phím trắng) + C#-D#-F#-G#-A# (Phím đen).
  - Visual: Sticker hoạt hình dán lên phím.

## 2. Hệ Thống "Siêu Năng Lượng" (GameFi Hợp Âm)

Thay đổi thuật ngữ học thuật thành ngôn ngữ Game:

- **Hợp âm 3 nốt** -> **"Siêu năng lượng"**.
- Nhiệm vụ: Nhấn 3 phím cùng lúc để kích hoạt hiệu ứng đặc biệt.

### Danh Sách Hợp Âm (Power List)

1. **Đô Trưởng (C Major)** (C-E-G): 🔥 Sức mạnh Lửa (Đỏ).
2. **Rê Trưởng (D Major)** (D-F#-A): 🌲 Sức mạnh Rừng Xanh (Xanh Lá).
3. **Mi Trưởng (E Major)** (E-G#-B): ☀️ Sức mạnh Ánh Sáng (Vàng).
4. **Fa Trưởng (F Major)** (F-A-C): 🌪️ Sức mạnh Gió (Xanh Dương Nhạt).
5. **Son Trưởng (G Major)** (G-B-D): 💧 Sức mạnh Nước (Xanh Dương Đậm).
6. **La Trưởng (A Major)** (A-C#-E): 💜 Sức mạnh Bóng Đêm/Vũ Trụ (Tím).
7. **Si Trưởng (B Major)** (B-D#-F#): 🌈 Sức mạnh Cầu Vồng (Hồng).

## 3. Quy Trình Kỹ Thuật

### 3.1. Logic "Triệu Hồi" (Detect Polyphony)

- **Vấn đề**: Bé 4 tuổi khó nhấn 3 phím cùng lúc chính xác 100%.
- **Giải pháp**: Logic "Loose Chord Detection".
  - Khi một phím được nhấn -> Thêm vào `Set` các phím đang active.
  - Trong vòng 500ms (cửa sổ thời gian), nếu `Set` chứa đủ các nốt của Hợp âm mục tiêu -> Kích hoạt `SUCCESS`.

### 3.2. Hiệu Ứng (VFX/SFX)

- Khi `SUCCESS`:
  - Phát tiếng hợp âm dày (PolySynth).
  - Hiệu ứng nổ hạt (Particle Explosion) toàn màn hình.
  - Cộng lượng lớn Xu.

## 4. Lộ Trình Code

- [ ] **Bước 1**: Cập nhật `TouchGame.jsx` để render bàn phím Piano đầy đủ (Trắng/Đen).
- [ ] **Bước 2**: Định nghĩa `CHORD_DATA` (Dữ liệu hợp âm).
- [ ] **Bước 3**: Thêm chế độ chơi mới "Triệu Hồi Hợp Âm" trong Touch Game.
- [ ] **Bước 4**: Viết hàm `checkChord` xử lý logic nhấn nhiều phím.
