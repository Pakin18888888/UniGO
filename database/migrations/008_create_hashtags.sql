-- UniGO! Database Migration
-- Migration: 008_create_hashtags
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: none

CREATE TABLE hashtags (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    name VARCHAR(60) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_hashtags PRIMARY KEY (id),

    CONSTRAINT uq_hashtags_name UNIQUE (name)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
