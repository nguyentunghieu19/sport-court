# Đăng ký tài khoản chủ sân trên web

## Luồng sử dụng

1. Tại trang đăng nhập web, chọn **Đăng ký chủ sân** (`/register-owner`).
2. Nhập họ tên, email hoặc số điện thoại, mật khẩu và nhập lại mật khẩu.
3. Backend tạo tài khoản mới với quyền `OWNER`, mã hóa mật khẩu và trả JWT.
4. Web đăng nhập ngay và mở tab **Thêm địa điểm**. Chủ sân tiếp tục thêm sân, bảng giá và nhân viên bằng các chức năng hiện có.

Không cần chạy SQL hoặc sửa vai trò thủ công. Dùng bảng `users` và giá trị `OWNER` đã có trong database. Khởi động lại backend và chạy lại web sau khi cập nhật code.

## API

`POST /api/auth/register-owner` là endpoint công khai, không cần token.

```json
{
  "fullName": "Nguyễn Văn An",
  "email": "owner@example.com",
  "phone": "0912345678",
  "password": "SportCourt123!"
}
```

- Có thể bỏ email hoặc phone (gửi `null`), nhưng phải có ít nhất một thông tin liên hệ.
- Mật khẩu từ 8 đến 72 ký tự, đồng thời không vượt giới hạn 72 byte UTF-8 của BCrypt. Nhập lại mật khẩu được kiểm tra trên web.
- Thành công: HTTP `201`, cùng định dạng `AuthResponse` với đăng nhập và `role: "OWNER"`.
- Dữ liệu không hợp lệ: `400`. Email/số điện thoại đã dùng: `409`.
- Backend tự gán quyền; payload không có trường chọn vai trò. `/api/auth/register` vẫn chỉ tạo `USER`.
- Email/số điện thoại của tài khoản hiện có không thể dùng để đăng ký thêm, cũng không tự nâng quyền tài khoản đó.

Luồng này cho phép chủ sân tự đăng ký và dùng ngay; chưa có bước duyệt hồ sơ hay xác minh email/OTP. Nhân viên vẫn do chủ sân tạo trong trang quản lý nhân viên.

## Kiểm tra hồi quy

Từ thư mục `backend`:

```powershell
.\mvnw.cmd -Dtest=OwnerRegistrationTest test
```

Test chạy controller, validation, BCrypt, JWT và kiểm tra quyền API chủ sân với repository giả lập, không kết nối database cá nhân. Bao gồm đăng ký/đăng nhập lại bằng email hoặc số điện thoại, chặn trùng liên hệ, dữ liệu sai, mật khẩu Unicode quá dài và chống chọn quyền qua payload.

Từ `admin-web`, chạy `npm run build`. Kiểm tra trên trình duyệt: link đăng ký, lỗi xác nhận mật khẩu, đăng ký thành công → tab thêm địa điểm, đăng xuất → đăng nhập lại, và bố cục trên màn hình hẹp.
