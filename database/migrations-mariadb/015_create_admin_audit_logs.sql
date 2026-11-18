-- UniGO! Database Migration
-- Migration: 015_create_admin_audit_logs
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: users
-- target_id is polymorphic; intentionally no target foreign key.
-- Audit retention / permissions need approval.

CREATE TABLE admin_audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    actor_user_id BIGINT UNSIGNED NOT NULL,

    action VARCHAR(80) NOT NULL,

    target_type VARCHAR(30) NULL,

    target_id BIGINT UNSIGNED NULL,

    result VARCHAR(20) NOT NULL,

    metadata JSON NULL,

    request_id VARCHAR(64) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_admin_audit_logs PRIMARY KEY (id),

    CONSTRAINT fk_admin_audit_logs_actor_user_id FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,

    INDEX idx_admin_audit_logs_actor_user_id_created_at (actor_user_id, created_at),

    INDEX idx_admin_audit_logs_action_created_at (action, created_at),

    INDEX idx_admin_audit_logs_target_type_target_id_created_at (target_type, target_id, created_at),

    INDEX idx_admin_audit_logs_created_at (created_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
