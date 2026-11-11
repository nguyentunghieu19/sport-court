-- Một ảnh đại diện cho mỗi địa điểm; có thể chạy lại an toàn.
ALTER TABLE public.venues
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS image_public_id TEXT;
