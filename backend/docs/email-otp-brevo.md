# Đăng ký email OTP và quên mật khẩu qua Brevo

## Cần làm trước khi chạy

1. Tạo tài khoản Brevo, xác minh địa chỉ sender (người gửi), bật quyền gửi transactional email. Nếu dùng domain riêng, hoàn thành xác thực domain theo hướng dẫn Brevo.
2. Trong SMTP & API / API keys tạo **API key**, không dùng SMTP key. Backend gọi HTTPS `POST https://api.brevo.com/v3/smtp/email`.
3. Chạy `backend/sql/email-otp.sql` trong đúng database local. Nếu deploy, chạy thêm trên Neon trước khi deploy backend. Script chỉ thêm bảng, không đánh dấu email cũ là verified và không xóa dữ liệu.
4. Cấu hình ba biến môi trường cho backend local / Render:

   ```text
   BREVO_API_KEY=<API key của Brevo>
   BREVO_SENDER_EMAIL=<email người gửi đã xác minh>
   OTP_SECRET=<chuỗi ngẫu nhiên ít nhất 32 ký tự, ưu tiên 64 ký tự>
   ```

   Với IntelliJ: Run Configuration → Environment variables. Với Render: Environment → thêm ba biến → Save and deploy. Không gửi key lên chat hoặc commit vào Git; không thêm biến vào Vercel/Android. Khởi động lại backend sau khi đổi biến. Không đặt các giá trị rỗng trực tiếp trong application.properties cá nhân vì chúng có thể ghi đè biến môi trường.
5. Deploy backend và web đồng bộ; build/cài APK mới vì đăng ký cũ chưa gửi emailToken sẽ bị backend từ chối. Endpoint đăng nhập và tài khoản cũ tiếp tục dùng được.

## Hành vi

- USER/OWNER: nhập thông tin và email thật → gửi OTP → nhập OTP và xác minh → hoàn tất đăng ký. OTP được cấp trước khi tạo users; không giữ tài khoản rác hoặc lưu mật khẩu chờ xác minh. Hai vai trò có purpose riêng do endpoint quyết định. Token xác minh nằm trong bộ nhớ ứng dụng, không lưu localStorage.
- Quên mật khẩu: nhập email → gửi OTP → xác minh → mật khẩu mới và xác nhận. Reset tăng token_version, vô hiệu JWT cũ; cần đăng nhập lại.
- Tài khoản cũ USER/OWNER có email và còn hoạt động vẫn nhận được OTP reset. Chứng minh sở hữu hộp thư bằng OTP thành công và reset sẽ đánh dấu email_verified=true. Tài khoản chỉ có điện thoại hoặc dùng email giả cần được ADMIN cập nhật email đúng sau khi kiểm tra danh tính; không chạy UPDATE xác minh hàng loạt. ADMIN/STAFF giữ luồng cấp/reset bởi quản trị/chủ sân.
- OTP 6 số, hạn 5 phút; token sau xác minh hạn 10 phút và chỉ dùng một lần. Gửi lại hủy mã/token cũ. Chờ 60 giây giữa hai lần gửi, tối đa 5 yêu cầu/email/purpose/giờ; tối đa 5 lần kiểm tra mã trong cửa sổ đó (gửi lại không xóa bộ đếm). Giới hạn thêm 100 lần/IP/nhóm thao tác/giờ; sử dụng remoteAddr, không tin X-Forwarded-For tùy ý. Nếu proxy tập trung IP, cần cấu hình trusted proxy trước khi điều chỉnh hạn mức.
- Hash OTP/token bằng HMAC-SHA256, secret phía backend; không log mã, token, secret hoặc response chứa key của Brevo. Các hàng challenge được khóa khi kiểm tra/tiêu thụ; token reset gắn ID tài khoản để không tác động tài khoản mới đăng ký lại cùng email.
- Thông báo gửi OTP là thông báo chung để không lộ email có tài khoản. Brevo chấp nhận gửi không bảo đảm thư đã vào inbox: xem Transactional logs và thư rác, kiểm tra sender/API key/hạn mức tài khoản nếu thư không tới.
- Có thể dọn challenge cũ định kỳ bằng `DELETE FROM email_challenges WHERE window_start < now() - interval '7 days' AND (token_expires_at IS NULL OR token_expires_at < now());` sau khi kiểm tra mục tiêu database.

## API

Gửi `{email}` tới `/api/auth/register/request-otp`, `/api/auth/register-owner/request-otp` hoặc `/api/auth/password/forgot`.
Xác minh `{email, code}` tại `/api/auth/register/verify-otp`, `/api/auth/register-owner/verify-otp`, `/api/auth/password/verify-otp`; kết quả `{token}`.
Đăng ký qua endpoint cũ với `{fullName,email,phone,password,emailToken}`.
Reset qua `/api/auth/password/reset` với `{email,token,newPassword}`. Tất cả là POST.

## Kiểm tra với email thật sau cấu hình

Đăng ký USER/OWNER, gửi lại OTP sau 60 giây, mã cũ/mã sai/hết hạn, token dùng lại, thử email trùng và token khác vai trò. Reset tài khoản có email thật, đăng nhập bằng mật khẩu mới, gọi API bằng JWT cũ phải thất bại. Xóa mềm rồi đăng ký lại email và kiểm tra token reset của ID cũ không áp dụng ID mới. Kiểm tra trên Android và web với cùng backend. Không thử tạo nhiều email hoặc reset tài khoản đang dùng của người khác.

Tài liệu Brevo: https://developers.brevo.com/docs/send-a-transactional-email
