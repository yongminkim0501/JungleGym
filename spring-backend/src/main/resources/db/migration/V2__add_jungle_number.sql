-- Existing members retain NULL until their official number is assigned.
ALTER TABLE users ADD COLUMN jungle_number VARCHAR(50);
ALTER TABLE users ADD CONSTRAINT uk_users_jungle_number UNIQUE (jungle_number);
