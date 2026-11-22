-- UniGO! Database Migration
-- Migration: 011_create_portfolios
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: users

CREATE TABLE portfolios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(150) NOT NULL,

    summary TEXT NULL,

    visibility VARCHAR(20) NOT NULL DEFAULT 'private',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,

    CONSTRAINT pk_portfolios PRIMARY KEY (id),

    CONSTRAINT uq_portfolios_user_id UNIQUE (user_id),

    CONSTRAINT fk_portfolios_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,

    INDEX idx_portfolios_visibility_created_at (visibility, created_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
