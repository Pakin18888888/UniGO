-- UniGO! Database Migration
-- Migration: 004_create_post_media
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: posts
-- Files are stored outside MySQL; CASCADE does not remove physical files.

CREATE TABLE post_media (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    post_id BIGINT UNSIGNED NOT NULL,

    file_key VARCHAR(500) NOT NULL,

    mime_type VARCHAR(100) NOT NULL,

    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_post_media PRIMARY KEY (id),

    CONSTRAINT fk_post_media_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE RESTRICT,

    INDEX idx_post_media_post_id_sort_order (post_id, sort_order)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
