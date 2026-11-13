# Quản trị hệ thống SportCourt

## Cài đặt database và tài khoản đầu tiên

1. Chạy `backend/sql/system-admin.sql` trong PostgreSQL trước khi khởi động backend mới. File tự tìm tên kiểu enum của `users.role`; thêm `ADMIN`, các cột xóa mềm/phiên đăng nhập và thông tin kiểm duyệt địa điểm. Có thể chạy lại; không xóa các bảng hoặc dữ liệu cũ.
   Sau đó chạy `backend/sql/release-deleted-account-contacts.sql`: điều chỉnh `ck_users_contact` để tài khoản đã xóa được phép không có liên hệ và giải phóng liên hệ còn giữ ở các tài khoản đã xóa trước đây. Tài khoản chưa xóa vẫn bắt buộc có email hoặc số điện thoại; các ràng buộc không trùng liên hệ vẫn được giữ.
2. Kết thúc giao dịch SQL của migration (`COMMIT`) trước khi dùng giá trị enum ADMIN. Đăng ký một tài khoản USER riêng bằng luồng hiện có, rồi chạy riêng lệnh cấp ADMIN được chú thích ở cuối file SQL, thay email của bạn.
3. Đăng nhập lại bằng trang `/login` chung. Admin vào `/admin`; OWNER/STAFF dùng giao diện quản lý sân hiện có.

Không có đăng ký admin công khai. Chỉ admin đang hoạt động mới tạo tài khoản admin tiếp theo qua giao diện quản lý tài khoản.

## API

Mọi endpoint dưới `/api/admin` cần JWT của ADMIN đang hoạt động trong database.

- `GET /api/admin/overview`: số tài khoản còn sử dụng, đang hoạt động, đã xóa; phân bố vai trò; địa điểm, địa điểm công khai đang hoạt động, địa điểm admin ẩn; sân con; đơn đặt và số đơn theo từng trạng thái. Không cộng tổng giá đơn thành doanh thu.
- `GET /api/admin/users?keyword=&role=&active=&page=0&size=10`: danh sách tài khoản chưa xóa, phân trang theo `PageResponse`.
- `POST /api/admin/users`, `PUT /api/admin/users/{id}`: JSON `fullName`, `email`, `phone`, `password`, `role`, `active`. Cần ít nhất email hoặc số điện thoại. Mật khẩu bắt buộc khi tạo; bỏ trống khi sửa để giữ mật khẩu. Vai trò USER, OWNER, STAFF, ADMIN.
- `DELETE /api/admin/users/{id}`: HTTP 204, xóa mềm và vô hiệu hóa tài khoản. Không xóa bản ghi được đơn đặt, thanh toán, địa điểm hoặc phân công tham chiếu.
- `GET /api/admin/venues?keyword=&hidden=&status=&page=0&size=10`: tất cả địa điểm, ảnh, chủ sân, số sân con, trạng thái chủ sân và thông tin ẩn.
- `GET /api/admin/venues/{id}`: chi tiết địa điểm và danh sách sân con.
- `PATCH /api/admin/venues/{id}/visibility`: JSON `{ "hidden": true, "reason": "Lý do vi phạm" }`; khi mở lại gửi `{ "hidden": false }`. Trả chi tiết địa điểm đã cập nhật.

## Quy tắc tài khoản

- Không được tự xóa, tự khóa hoặc tự hạ quyền admin đang đăng nhập; luôn giữ ít nhất một admin hoạt động. Các thao tác quản lý tài khoản khóa cùng danh sách admin theo thứ tự ID để tránh hai yêu cầu đồng thời loại bỏ admin cuối.
- Không chuyển OWNER sang vai trò khác khi còn địa điểm, hoặc STAFF đã có lịch sử phân công sang vai trò khác; cần giải quyết quan hệ nghiệp vụ trước.
- Khi xóa mềm, email/số điện thoại được đặt thành `NULL` và cờ xác minh được xóa trong cùng transaction với khóa tài khoản, ghi `deleted_at` và tăng `token_version`. Có thể dùng lại thông tin liên hệ để đăng ký; tài khoản mới có ID mới, không kế thừa vai trò, xác minh, địa điểm, phân công hoặc lịch sử tài khoản cũ. Tài khoản chưa xóa vẫn không được trùng email/số điện thoại.
- Cần chạy `backend/sql/release-deleted-account-contacts.sql` trước khi dùng cơ chế xóa mới trên database có ràng buộc `ck_users_contact` cũ. Script chỉ cập nhật dữ liệu tài khoản đã có `deleted_at`, không xóa ID hoặc dữ liệu nghiệp vụ. Không áp dụng cho tài khoản chỉ bị khóa.
- Hiện chưa có OTP trong backend. Khi bổ sung, mã OTP/đặt lại mật khẩu phải gắn ID và phiên tài khoản, bị vô hiệu khi tài khoản bị xóa; không dùng email làm căn cứ chuyển quyền sang tài khoản mới.
- Xóa mềm không tự hủy các đơn đã tồn tại. Địa điểm của chủ sân đã xóa bị loại khỏi tìm kiếm và không nhận đơn mới, nhưng nhân viên được phân công vẫn có thể xử lý đơn cũ.
- JWT được kiểm tra tài khoản trong database ở mỗi yêu cầu xác thực. Khóa/xóa tài khoản có hiệu lực ngay. Đổi vai trò, khóa/mở khóa, đặt lại mật khẩu hoặc xóa tăng `token_version`, khiến token cũ không dùng lại được sau khi mở khóa. Token cũ chưa có claim phiên được coi là phiên 0 để tương thích migration.
- Đặt lại mật khẩu của chính admin khiến phiên hiện tại hết hiệu lực ở yêu cầu tiếp theo, cần đăng nhập lại.

## Quy tắc địa điểm

`admin_hidden` tách biệt với trạng thái ACTIVE/INACTIVE do chủ sân quản lý. Chủ sân không thể tự mở một địa điểm đã bị admin ẩn. Lý do, thời gian và admin thực hiện được lưu trong database. Bỏ ẩn xóa các thông tin ẩn hiện tại. Chưa có nhật ký bất biến lưu toàn bộ lịch sử kiểm duyệt.

Địa điểm bị ẩn hoặc có chủ sân đã xóa không xuất hiện trong API công khai, không xem lịch trống/đặt mới. Các đơn đã có vẫn được giữ để xử lý thanh toán, hủy và hoàn tiền theo luồng hiện có. Mở lại địa điểm không tự mở tài khoản chủ sân đã xóa; giao diện quản trị hiển thị trạng thái chủ sân riêng.

## Kiểm thử

Các test `AdminAccountServiceTest`, `AdminVenueServiceTest`, `AdminSecurityTest`, `AccountJwtAuthenticationConverterTest` và `AdminOverviewServiceTest` chạy bằng repository giả lập, không sửa database cá nhân. Chạy thêm các test đăng ký, ảnh địa điểm và public catalog để kiểm tra hồi quy.
