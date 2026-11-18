-- UniGO! Database Migration
-- Migration: 009_create_post_hashtags
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: hashtags, posts

CREATE TABLE post_hashtags (
    post_id BIGINT UNSIGNED NOT NULL,

    hashtag_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_post_hashtags PRIMARY KEY (post_id, hashtag_id),

    CONSTRAINT fk_post_hashtags_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE RESTRICT,

    CONSTRAINT fk_post_hashtags_hashtag_id FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE ON UPDATE RESTRICT,

    INDEX idx_post_hashtags_hashtag_id_post_id (hashtag_id, post_id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
