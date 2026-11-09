BEGIN;

-- Đơn cũ chưa check-in giữ nguyên giá trị NULL.
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS checked_in_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS checked_in_by bigint REFERENCES users (id);

COMMIT;
