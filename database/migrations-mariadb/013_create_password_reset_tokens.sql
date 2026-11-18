-- UniGO! Database Migration
-- Migration: 013_create_password_reset_tokens
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: users
-- token_hash assumes lowercase/uppercase hex is handled consistently by the backend.

CREATE TABLE password_reset_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,

    expires_at DATETIME NOT NULL,

    used_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_password_reset_tokens PRIMARY KEY (id),

    CONSTRAINT uq_password_reset_tokens_token_hash UNIQUE (token_hash),

    CONSTRAINT fk_password_reset_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,

    INDEX idx_password_reset_tokens_user_id_expires_at (user_id, expires_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
