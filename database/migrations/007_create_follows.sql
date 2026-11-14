-- UniGO! Database Migration
-- Migration: 007_create_follows
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: users

CREATE TABLE follows (
    follower_id BIGINT UNSIGNED NOT NULL,

    following_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_follows PRIMARY KEY (follower_id, following_id),

    CONSTRAINT fk_follows_follower_id FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,

    CONSTRAINT fk_follows_following_id FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,

    INDEX idx_follows_following_id_follower_id (following_id, follower_id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
