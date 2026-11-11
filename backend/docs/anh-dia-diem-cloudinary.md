# Một ảnh đại diện cho địa điểm trên Cloudinary

## Cấu hình sau khi có khóa

Database cần hai cột trong `venues`: `image_url TEXT` và `image_public_id TEXT`. Nếu đã chạy SQL trước đó thì không phải chạy lại. File `backend/sql/venue-image.sql` có lệnh chạy lại an toàn.

Đặt ba biến môi trường trong Run Configuration của IntelliJ hoặc terminal chạy backend:

```text
CLOUDINARY_CLOUD_NAME=ten_cloud_cua_ban
CLOUDINARY_API_KEY=api_key_cua_ban
CLOUDINARY_API_SECRET=api_secret_cua_ban
```

Khởi động lại backend sau khi cấu hình. Có thể dùng các thuộc tính sau trong `application.properties` cá nhân đã được Git bỏ qua thay cho biến môi trường:

```properties
app.cloudinary.cloud-name=ten_cloud_cua_ban
app.cloudinary.api-key=api_key_cua_ban
app.cloudinary.api-secret=api_secret_cua_ban
```

Không đưa khóa thật vào file `.example`, React, Android, hoặc Git. Không cần unsigned upload preset: backend gửi request có chữ ký đến Cloudinary. Backend vẫn khởi động khi chưa có khóa; upload khi chưa cấu hình trả HTTP `503` với thông báo rõ ràng. Tạo/sửa địa điểm không có ảnh vẫn hoạt động.

## Luồng web

- **Thêm địa điểm**: chọn một file trên máy, xem trước, bấm tạo. Web tạo địa điểm qua API JSON hiện có rồi tải ảnh lên. Nếu địa điểm đã tạo nhưng upload lỗi, web giữ mã địa điểm để thử lại ảnh, tránh tạo địa điểm trùng.
- **Sửa địa điểm**: xem ảnh hiện tại, chọn ảnh mới và lưu, hoặc xóa ảnh. Ảnh chỉ được thay khi upload và cập nhật database thành công.
- Ảnh được lưu trên Cloudinary; database chỉ lưu URL HTTPS và public ID. Các response web/public trả `imageUrl`, không trả public ID nội bộ. Android có thể nhận `imageUrl` qua API địa điểm; phần hiển thị Android cần được bổ sung riêng.

## API cho chủ sân

```text
POST   /api/owner/venues/{id}/image
Authorization: Bearer <OWNER JWT>
Content-Type: multipart/form-data
file: <binary image>

DELETE /api/owner/venues/{id}/image
Authorization: Bearer <OWNER JWT>
```

Cả hai trả JSON `VenueResponse`, có `imageUrl` (hoặc `null` sau khi xóa). Chỉ chủ sở hữu đang hoạt động được thao tác. Địa điểm của chủ sân khác trả `404`; USER/STAFF bị từ chối. API JSON tạo/sửa cũ không nhận URL ảnh từ client.

Nhận JPG/JPEG, PNG hoặc WebP tĩnh, tối đa **5 MiB** (5 × 1024 × 1024 byte), tối đa 20 megapixel và 10.000 pixel mỗi chiều. Backend nhận dạng từ nội dung, không tin phần mở rộng/MIME do trình duyệt gửi. JPEG/PNG được giải mã kiểm tra tại backend; WebP được kiểm tra container/kích thước trước và Cloudinary image endpoint giải mã đầy đủ trước khi database lưu kết quả. Ảnh SVG/GIF và ảnh động WebP không được nhận.

Lỗi thường gặp: `400` file lỗi/thiếu file, `413` quá dung lượng, `503` thiếu cấu hình, `502` không kết nối được Cloudinary hoặc cấu hình sai. Web cho tối đa 90 giây cho thao tác ảnh; backend giới hạn kết nối 10 giây, upload 30 giây và xóa 10 giây.

## Thay/xóa và xử lý lỗi

Mỗi lần upload dùng một public ID ngẫu nhiên riêng, không ghi đè ảnh cũ trên Cloudinary. Backend khóa hàng địa điểm trong transaction, lưu cặp URL/public ID mới rồi mới dọn ảnh cũ sau commit. Nếu database rollback, dọn ảnh mới và giữ ảnh cũ. Cập nhật thông tin/trạng thái địa điểm dùng cùng khóa hàng để tránh ghi đè URL ảnh khi hai thao tác xảy ra đồng thời.

Cloudinary và PostgreSQL không có transaction chung. Dọn ảnh là best effort: nếu Cloudinary mất kết nối lúc xóa, hoặc tiến trình chết giữa upload và commit, có thể còn file không được dùng. Lỗi dọn ảnh sau transaction được ghi log theo `public_id`; khi cần có thể tìm và xóa file đó trong Media Library. Không có hàng đợi dọn lại tự động trong giai đoạn này. Thay ảnh dùng URL/public ID mới nên không bị cache ảnh cũ; lệnh xóa yêu cầu `invalidate=true`, CDN có thể cần thêm thời gian để cập nhật.

## Kiểm tra

Từ `backend`, chạy các test ảnh và hồi quy đăng ký/public API:

```powershell
.\mvnw.cmd '-Dtest=VenueImageServiceTest,VenueImageValidatorTest,CloudinaryImageStorageTest,OwnerVenueImageControllerTest,PublicVenueImageTest,OwnerRegistrationTest' test
```

Test không cần khóa Cloudinary thật và không sửa database cá nhân. Chúng kiểm tra nội dung file, phân quyền, multipart có chữ ký, phản hồi lỗi, giữ ảnh cũ khi upload lỗi và xử lý commit/rollback. Sau khi điền khóa thật, thử chọn ảnh → tạo địa điểm → tải lại trang → thay ảnh → xóa ảnh để kiểm tra tài khoản Cloudinary và kết nối Internet của máy.

Tài liệu Cloudinary chính thức dùng cho tích hợp: [Upload API](https://cloudinary.com/documentation/image_upload_api_reference), [chữ ký xác thực](https://cloudinary.com/documentation/authentication_signatures).
