-- Chạy một lần trước khi khởi động backend mới. Có thể chạy lại an toàn.
-- Tìm đúng kiểu enum đang gắn với public.users.role, không đoán tên kiểu.
DO $$
DECLARE role_type text;
BEGIN
    SELECT format('%I.%I', n.nspname, t.typname) INTO role_type
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace cn ON cn.oid = c.relnamespace
    JOIN pg_type t ON t.oid = a.atttypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE cn.nspname = 'public' AND c.relname = 'users' AND a.attname = 'role'
      AND NOT a.attisdropped AND t.typtype = 'e';
    IF role_type IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy cột public.users.role dùng PostgreSQL enum';
    END IF;
    EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', role_type, 'ADMIN');
END $$;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS token_version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.venues
    ADD COLUMN IF NOT EXISTS admin_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS admin_hidden_reason TEXT,
    ADD COLUMN IF NOT EXISTS admin_hidden_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admin_hidden_by BIGINT REFERENCES public.users(id);

-- Sau khi lệnh trên đã COMMIT, cấp ADMIN cho một tài khoản riêng đã đăng ký:
-- UPDATE public.users SET role = 'ADMIN', token_version = token_version + 1
-- WHERE email = 'EMAIL_TAI_KHOAN_QUAN_TRI_CUA_BAN' AND deleted_at IS NULL
-- RETURNING id, full_name, role;
-- Không dùng tài khoản chủ sân đang sở hữu địa điểm để làm quản trị viên hệ thống.
