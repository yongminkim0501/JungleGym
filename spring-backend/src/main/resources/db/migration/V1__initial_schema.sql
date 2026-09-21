CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    nickname VARCHAR(25) NOT NULL,
    name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(2048),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_nickname UNIQUE (nickname)
);

CREATE TABLE gym_visits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    checked_in_at TIMESTAMP(6) NOT NULL,
    checked_out_at TIMESTAMP(6),
    active_user_id BIGINT,
    workout_title VARCHAR(100) NOT NULL DEFAULT '',
    workout_image_url VARCHAR(2048),
    CONSTRAINT fk_gym_visits_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_gym_visits_active_user UNIQUE (active_user_id)
);

CREATE INDEX idx_gym_visits_user_checkin ON gym_visits(user_id, checked_in_at);
