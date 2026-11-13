-- Dành cho tài khoản đã xóa mềm trước khi cơ chế giải phóng liên hệ được bổ sung.
-- Có thể chạy lại; giữ nguyên ID, vai trò và liên kết lịch sử nghiệp vụ.
-- Không tác động tài khoản chỉ bị khóa (deleted_at IS NULL).
BEGIN;
-- Tài khoản chưa xóa vẫn bắt buộc có ít nhất một thông tin đăng nhập.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS ck_users_contact;
ALTER TABLE public.users ADD CONSTRAINT ck_users_contact
    CHECK (deleted_at IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL);

UPDATE public.users
SET email = NULL,
    phone = NULL,
    email_verified = FALSE,
    phone_verified = FALSE,
    is_active = FALSE,
    token_version = token_version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NOT NULL
  AND (email IS NOT NULL OR phone IS NOT NULL
       OR email_verified OR phone_verified OR is_active);
COMMIT;
