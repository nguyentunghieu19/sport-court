# Bài 22 – Vận hành đơn đặt tại sân

Chạy [SQL của bài 22](../sql/22-onsite-booking.sql) trên database thử nghiệm trước khi khởi động backend. Script thêm hai cột cho thời điểm và người ghi nhận khách đến. Các đơn cũ giữ giá trị `NULL` ở hai cột này.

Gửi `Authorization: Bearer <token>` của chủ sân hoặc nhân viên đang hoạt động. Chủ sân thao tác trên sân của mình và nhân viên thao tác trên sân được phân công.

| API | Dữ liệu gửi | Điều kiện |
| --- | --- | --- |
| `POST /api/manage/bookings/{id}/check-in` | Không cần body | Đơn `CONFIRMED`, từ 30 phút trước giờ bắt đầu đến trước giờ kết thúc |
| `POST /api/manage/bookings/check-in` | `{"bookingCode":"BK261109-XXXXXX"}` | Cùng quy tắc như check-in theo ID. Android gửi mã đơn đọc được từ QR |
| `POST /api/manage/bookings/{id}/complete` | Không cần body | Đơn đã check-in và đã đến giờ kết thúc. Có thể hoàn thành khi khách còn nợ |
| `POST /api/manage/bookings/{id}/no-show` | Không cần body | Đơn `CONFIRMED`, chưa check-in và đã đến giờ kết thúc |
| `GET /api/manage/bookings?outstandingOnly=true` | Hỗ trợ các bộ lọc sẵn có như `venueId`, `fieldId`, `date`, `status`, `keyword`, `page`, `size` | Trả về danh sách phân trang các đơn còn tiền phải thu |
| `POST /api/manage/bookings/{id}/onsite-payment` | `{"method":"CASH","amount":150000,"idempotencyKey":"8b3bb770-3b30-4208-8e6f-355c04ae44dc"}` | Ghi nhận đã thu đủ số tiền còn lại cho đơn đã check-in hoặc đã hoàn thành. Dùng `BANK_TRANSFER` cho chuyển khoản |

Các API thay đổi trạng thái trả về `ManagerBookingResponse` có `checkedInAt` và `checkedInByName`. Đơn vẫn ở `CONFIRMED` sau check-in và không thể hủy sau khi đã ghi nhận khách đến. API ghi nhận thu tiền trả về `PaymentResponse`. Lấy `amount` từ `outstandingAmount` của đơn và dùng một UUID mới cho mỗi lần thu. Khi gửi lại cùng giao dịch do lỗi mạng, giữ nguyên UUID và nội dung yêu cầu.

Số còn phải thu áp dụng cho đơn `CONFIRMED` và `COMPLETED`. Backend lấy tổng giá trị đơn trừ phần tiền đã thu còn được giữ lại sau khi tính cả khoản đã hoàn và đang chờ hoàn. Ghi nhận thu tiền tại sân chỉ lưu khoản đã nhận, không khởi tạo giao dịch ngân hàng.

## Kiểm tra trên database thử nghiệm

1. Chuẩn bị một đơn đã xác nhận và đã thanh toán cọc thuộc cụm sân của tài khoản thử nghiệm. Đối chiếu số tiền còn phải thu trong chi tiết đơn và danh sách còn nợ.
2. Trong thời gian cho phép, check-in theo mã đơn rồi gọi lại theo ID. Kiểm tra thời điểm và người ghi nhận chỉ được lưu một lần. Gọi cùng API bằng tài khoản ngoài phạm vi cụm sân và kiểm tra yêu cầu bị từ chối.
3. Ghi nhận thu số tiền còn lại bằng tiền mặt hoặc chuyển khoản. Gửi lại cùng yêu cầu với cùng UUID, kiểm tra ID giao dịch giữ nguyên, số tiền chỉ tăng một lần và đơn rời danh sách còn nợ. Thử gửi số tiền sai trên một đơn còn nợ khác và kiểm tra không phát sinh giao dịch.
4. Sau giờ kết thúc, đánh dấu đơn đã check-in là hoàn thành. Với một đơn khác đã qua giờ kết thúc và chưa check-in, ghi nhận khách không đến. Kiểm tra API không cho đổi qua lại giữa hai trạng thái kết thúc.
