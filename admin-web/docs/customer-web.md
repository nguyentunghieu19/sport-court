# Web khách hàng SportCourt

Web khách hàng chạy trong cùng ứng dụng React với khu vực chủ sân, nhân viên và quản trị viên. Dùng chung backend và tài khoản với Android.

## Chạy local

1. Chạy backend hiện tại trên cổng `8080`, với PostgreSQL và các migration trước đó đã được áp dụng.
2. Trong thư mục `admin-web`, chạy `npm install` nếu chưa cài thư viện, sau đó `npm run dev`.
3. Mở `http://localhost:5173/` để vào trang tìm sân.
4. Dùng nút khu vực quản lý hoặc lựa chọn **Chủ sân / Admin / Nhân viên** ở trang đăng nhập để truy cập các màn hình quản lý.

Web lấy ảnh địa điểm từ `imageUrl` của API công khai. Không cần đưa Cloudinary API secret vào frontend. Nếu chưa có ảnh hoặc URL ảnh hỏng, giao diện dùng nền minh họa dự phòng.

## Chức năng và API

| Màn hình | Chức năng | API hiện có |
| --- | --- | --- |
| Trang chủ | Tìm theo tên, thành phố, quận/huyện, môn thể thao; phân trang; ảnh địa điểm | `GET /api/public/venues`, `GET /api/public/sport-types` |
| Chi tiết địa điểm | Ảnh đầu trang, thông tin địa điểm, sân con, chính sách đặt/hủy | `GET /api/public/venues/{id}` |
| Lịch sân | Chọn ngày và các giờ chơi liên tiếp, hiển thị giá theo khung giờ | `GET /api/public/fields/{fieldId}/availability` |
| Xác nhận đặt | Kiểm tra lại khung giờ, giá dự kiến, ghi chú; tạo đơn | `POST /api/bookings` |
| Lịch đặt của tôi | Lọc trạng thái, phân trang, xem chi tiết và sao chép mã đơn | `GET /api/bookings/my`, `GET /api/bookings/{id}` |
| Hủy đơn | Xem hạn hủy, tiền hoàn, tiền giữ lại trước khi xác nhận | `GET /api/bookings/{id}/cancellation-preview`, `POST /api/bookings/{id}/cancel` |
| Thanh toán | Chọn cọc hoặc toàn bộ qua VNPay, xem trạng thái từ backend | `POST /api/payments/vnpay`, `GET /api/payments/{id}` |
| Giao dịch | Lịch sử thanh toán và tiến độ hoàn tiền, có phân trang | `GET /api/payments/my`, `GET /api/refunds/my` |
| Thông báo & cập nhật | Trạng thái 10 đơn gần đây và 10 yêu cầu hoàn tiền gần đây | Hai API danh sách đơn/hoàn tiền ở trên |
| Tài khoản | Xem thông tin, sửa họ tên, đổi mật khẩu, đăng xuất | `GET/PUT /api/users/me`, `POST /api/users/me/change-password` |

## Tài khoản và phân quyền

- Đăng nhập có hai nhóm: **Người dùng** và **Chủ sân / Admin / Nhân viên**. Vai trò thực tế luôn lấy từ backend.
- Đăng ký công khai chỉ tạo `USER` hoặc `OWNER`. Không có lựa chọn tự đăng ký `ADMIN` hoặc `STAFF`.
- Sau đăng nhập: `USER` về trang khách hàng, `OWNER/STAFF` về `/manage`, `ADMIN` về `/admin`.
- Khách chưa đăng nhập có thể xem danh sách, chi tiết địa điểm và lịch trống. Khi đặt sân, web yêu cầu đăng nhập và giữ đường dẫn quay lại bước đặt.
- Tài khoản Android `USER` đăng nhập được web bằng cùng email/số điện thoại và mật khẩu; lịch sử được dùng chung.
- Backend chỉ cho sửa họ tên qua API hồ sơ. Email và số điện thoại được hiển thị để xem, tránh tạo cảm giác đã sửa được thông tin mà backend không lưu.

## Thanh toán VNPay

Web sử dụng URL thanh toán backend ký, mở VNPay ở tab riêng và đọc lại giao dịch từ backend khi người dùng quay lại. Nếu trình duyệt chặn tab mới, dùng liên kết mở trang thanh toán được hiển thị trong giao diện.

Không tự kết luận thành công từ tham số URL. Kết quả chính thức lấy từ `GET /api/payments/{id}` và đơn đặt. Backend vẫn xác minh chữ ký callback VNPay trước khi ghi nhận tiền.

Backend hiện chỉ tạo giao dịch online khi đơn ở trạng thái chờ thanh toán. Sau khi cọc, phần tiền còn lại được thu tại sân theo luồng bài 22.

## Giới hạn tương ứng backend hiện tại

- Chưa có API thông báo riêng/đánh dấu đã đọc. Trang cập nhật tổng hợp dữ liệu thật từ đơn và hoàn tiền; không tạo thời gian hoặc số thông báo chưa đọc giả.
- Chưa có API quên mật khẩu bằng OTP; phần này cần được triển khai riêng trước khi bổ sung nút gửi OTP hoạt động.
- Hủy đơn và hoàn tiền áp dụng chính sách backend. Ghi nhận hoàn tiền cần chủ sân/nhân viên xác nhận theo luồng hiện có.

## Kịch bản kiểm tra thủ công

1. Mở trang chủ khi chưa đăng nhập. Tìm kiếm, đổi bộ lọc, chuyển trang, xóa bộ lọc. Kiểm tra thông báo khi backend mất kết nối và nút thử lại.
2. Mở địa điểm có ảnh Cloudinary và địa điểm chưa có ảnh. Kiểm tra ảnh đầu trang, chính sách và danh sách sân con.
3. Chọn ngày, một giờ hoặc nhiều giờ liên tiếp. Không chọn được giờ đã bận/đã qua; đổi ngày không giữ nhầm lựa chọn của ngày trước.
4. Bấm đặt khi chưa đăng nhập. Đăng nhập/đăng ký `USER` rồi quay lại lịch đã chọn. Kiểm tra tạo đơn chỉ gửi một yêu cầu khi bấm nhanh nhiều lần.
5. Đăng nhập đúng từng nhóm `USER`, `OWNER`, `STAFF`, `ADMIN`; thử chọn sai nhóm và truy cập URL của vai trò khác. Kiểm tra không có vòng lặp chuyển trang.
6. Thanh toán cọc, thanh toán toàn bộ, hủy ở VNPay và tab mới bị chặn. Quay lại web và kiểm tra trạng thái đơn, giao dịch, số tiền với database.
7. Hủy đơn trong/trễ hạn. Đọc bản xem trước, xác nhận hủy, kiểm tra số tiền chờ hoàn và trạng thái sau khi nhân viên xác nhận hoàn.
8. Kiểm tra lịch sử có nhiều trang và các trạng thái chờ thanh toán, xác nhận, hoàn thành, hủy, không đến.
9. Sửa họ tên rồi tải lại trang. Đổi mật khẩu sai mật khẩu cũ, xác nhận không khớp, mật khẩu ngắn và trường hợp hợp lệ; đăng xuất rồi đăng nhập với mật khẩu mới.
10. Xem ở màn hình điện thoại và desktop: menu, bộ lọc, biểu mẫu, lịch sân, nút thanh toán và các thông báo lỗi không bị tràn ngang.
11. Admin ẩn một địa điểm: địa điểm biến mất khỏi trang công khai, truy cập trực tiếp/đặt mới bị backend chặn, đơn cũ vẫn xem được trong lịch sử khách hàng.

Các bước có tạo tài khoản, đặt sân và thanh toán nên thực hiện trên dữ liệu demo để dễ đối chiếu kết quả.

## Kết quả kiểm tra triển khai (13/11/2026)

- Build TypeScript/Vite và ESLint các phần thay đổi thành công. Bốn bài kiểm tra `node --test tests/auth-navigation.test.mjs` xác nhận điều hướng vai trò và đường dẫn quay lại an toàn.
- Kiểm tra trình duyệt với backend Spring Boot và PostgreSQL riêng: xem danh sách/ảnh/chi tiết, chọn hai giờ liên tiếp, đăng nhập giữ lựa chọn, tạo đơn 200.000đ với cọc 60.000đ, tạo liên kết VNPay, xem trước và hủy đơn; sửa hồ sơ, xem thông báo và lịch sử thanh toán/hoàn tiền. Kiểm tra màn hình 1366px và 390px.
- Kiểm tra API đăng ký USER/OWNER, giới hạn quyền, đổi mật khẩu và callback thanh toán ký bằng khóa QA: chữ ký sai bị từ chối, gửi lặp không ghi nhận hai lần, hủy đơn đã trả đủ sinh một yêu cầu hoàn đúng số tiền.
- Không thực hiện giao dịch qua cổng VNPay thật. Không thay đổi database sử dụng thực tế. Backend hiện có vẫn giữ phiên JWT khi người dùng tự đổi mật khẩu.
- Web khách hàng không yêu cầu migration mới; cần các migration của backend trước đó như thông thường.
