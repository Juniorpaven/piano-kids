# Hướng Dẫn Triển Khai (Deploy) Piano Kids

Để bé có thể chơi trên điện thoại (iPhone/Android), bạn cần đẩy chuỗi code này lên internet. Vì ứng dụng dùng Microphone, nó **BẮT BUỘC** phải chạy trên `HTTPS` (các nền tảng dưới đây đều hỗ trợ miễn phí).

## Cách 1: Triển khai siêu tốc với Netlify Drop (Không cần tạo tài khoản GitHub)

Cách này nhanh nhất để test ngay.

1. Chạy lệnh sau ở terminal máy tính của bạn để tạo ra thư mục `dist` (chứa trang web đã đóng gói):

    ```bash
    npm run build
    ```

    *(Bạn sẽ thấy một thư mục `dist` mới xuất hiện trong `piano-kids`)*

2. Truy cập: [https://app.netlify.com/drop](https://app.netlify.com/drop)
3. Kéo thả thư mục `dist` đó vào ô "Drop right here" trên web Netlify.
4. Chờ 10 giây, Netlify sẽ cho bạn một đường link (ví dụ: `https://piano-kids-random.netlify.app`).
5. Gửi link đó qua Zalo/Facebook cho điện thoại và chơi ngay!

---

## Cách 2: Triển khai chuyên nghiệp với Vercel (Khuyên dùng lâu dài)

Cách này giúp web ổn định, cập nhật dễ dàng mỗi khi bạn sửa code.

### Bước 1: Đẩy mã nguồn lên GitHub

1. Đăng nhập [GitHub.com](https://github.com/new) và tạo một Repository mới (chọn Public). Đặt tên là `piano-kids`.
2. Sau khi tạo xong, GitHub sẽ hiện các dòng lệnh. Hãy copy và chạy các dòng lệnh tương tự dưới đây ở terminal của bạn:

    ```bash
    git remote add origin https://github.com/<TÊN_USER_CỦA_BẠN>/piano-kids.git
    git branch -M main
    git push -u origin main
    ```

    *(Thay `<TÊN_USER_CỦA_BẠN>` bằng username GitHub của bạn)*

### Bước 2: Kết nối Vercel

1. Truy cập [Vercel.com](https://vercel.com/signup) và đăng nhập bằng tài khoản GitHub.
2. Nhấn nút **"Add New..."** -> **"Project"**.
3. Tìm repo `piano-kids` bạn vừa up và nhấn **"Import"**.
4. Ở màn hình cài đặt, mọi thứ Vercel đã tự nhận diện (Framework Vite, React). Chỉ cần nhấn **"Deploy"**.
5. Chờ khoảng 1 phút. Khi pháo hoa bắn lên 🎉, bạn sẽ có link chính thức (ví dụ: `piano-kids.vercel.app`).

---

## Lưu ý quan trọng khi chạy trên Điện Thoại (Mobile) 📱

1. **Quyền truy cập Micro:**
    * Lần đầu mở web trên điện thoại, trình duyệt sẽ hỏi "Cho phép dùng Microphone?". **Bạn phải chọn "Cho phép" (Allow)**.
    * Trên **iPhone (iOS Safari)**: Do bảo mật cao, bạn cần chạm vào nút "Bắt đầu chơi" (đây là thao tác mà code mình đã xử lý) để kích hoạt Micro.

2. **Đặt điện thoại ở đâu?**
    * Hãy đặt điện thoại ngay trên giá để nhạc của đàn Piano.
    * Micro điện thoại nên hướng về phía dây đàn/loa của đàn để bắt tiếng tốt nhất.

3. **Khắc phục lỗi không nghe thấy:**
    * Nếu web không nhận diện, hãy thử tải lại trang (Refresh).
    * Kiểm tra xem ốp điện thoại có che mất lỗ mic không.
    * Đảm bảo không gian không quá ồn (tiếng tivi, quạt gió mạnh).

Chúc bạn và bé thành công! 🎹🐢
