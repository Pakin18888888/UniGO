
-- UniGO! Database Migration
-- Migration: 003_create_posts
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Requires team schema approval.
-- Dependency: 001_create_users.sql
-- Foreign Key deletion policy is pending approval.

CREATE TABLE posts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    user_id BIGINT UNSIGNED NOT NULL,

    content TEXT NULL,

    moderation_status VARCHAR(20)
        NOT NULL DEFAULT 'visible',

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL DEFAULT NULL,

    CONSTRAINT pk_posts
        PRIMARY KEY (id),

    CONSTRAINT fk_posts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    INDEX idx_posts_user_created (
        user_id,
        created_at
    ),

    INDEX idx_posts_created (
        created_at
    )

) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
