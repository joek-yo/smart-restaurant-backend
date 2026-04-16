-- 📁 src/domains/sessions/migrations/001_create_sessions_table.sql

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    business_id VARCHAR(255) NOT NULL,
    branch_id VARCHAR(255),
    state VARCHAR(50) NOT NULL DEFAULT 'START',
    discount JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_business ON sessions(business_id);
CREATE INDEX idx_sessions_branch ON sessions(branch_id);
CREATE INDEX idx_sessions_state ON sessions(state);