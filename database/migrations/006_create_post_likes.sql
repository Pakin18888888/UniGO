-- UniGO! Database Migration
-- Migration: 006_create_post_likes
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: posts, users

CREATE TABLE post_likes (
    post_id BIGINT UNSIGNED NOT NULL,

    user_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_post_likes PRIMARY KEY (post_id, user_id),

    CONSTRAINT fk_post_likes_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE RESTRICT,

    CONSTRAINT fk_post_likes_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,

    INDEX idx_post_likes_user_id (user_id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
