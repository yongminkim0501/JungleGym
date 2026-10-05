ALTER TABLE users ADD COLUMN suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN admin_note VARCHAR(500) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN admin_revision BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN security_version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE admin_audit_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    admin_id INTEGER NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    detail VARCHAR(4000) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_admin_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_admin_audit_created ON admin_audit_events(created_at);
