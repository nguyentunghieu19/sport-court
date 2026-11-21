-- Chạy một lần trên từng database sử dụng (local và Neon).
CREATE TABLE IF NOT EXISTS email_challenges (
 email VARCHAR(255) NOT NULL, purpose VARCHAR(30) NOT NULL,
 code_hash VARCHAR(64), expires_at TIMESTAMPTZ,
 token_hash VARCHAR(64), token_expires_at TIMESTAMPTZ,
 attempts INTEGER NOT NULL DEFAULT 0, sends INTEGER NOT NULL DEFAULT 0,
 window_start TIMESTAMPTZ NOT NULL DEFAULT now(), last_sent TIMESTAMPTZ,
 user_id BIGINT REFERENCES users(id), PRIMARY KEY(email,purpose)
);
