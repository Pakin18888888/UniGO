-- UniGO! Database Migration
-- Migration: 010_create_post_reports
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: posts, users

CREATE TABLE post_reports (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    post_id BIGINT UNSIGNED NOT NULL,

    reporter_id BIGINT UNSIGNED NOT NULL,

    reason VARCHAR(30) NOT NULL,

    description TEXT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    reviewed_by BIGINT UNSIGNED NULL,

    admin_note TEXT NULL,

    reviewed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_post_reports PRIMARY KEY (id),

    CONSTRAINT uq_post_reports_post_id_reporter_id UNIQUE (post_id, reporter_id),

    CONSTRAINT fk_post_reports_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,

    CONSTRAINT fk_post_reports_reporter_id FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,

    CONSTRAINT fk_post_reports_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,

    INDEX idx_post_reports_status_created_at_id (status, created_at, id),

    INDEX idx_post_reports_reporter_id (reporter_id),

    INDEX idx_post_reports_reviewed_by (reviewed_by)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
