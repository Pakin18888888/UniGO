
-- UniGO! Database Migration
-- Migration: 014_create_sessions
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Session Store: express-mysql-session 3.0.3
-- Requires final schema approval.
-- Dependency: none

CREATE TABLE sessions (
    session_id VARCHAR(128)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_bin
        NOT NULL,

    expires INT UNSIGNED NOT NULL,

    data MEDIUMTEXT
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_bin
        NULL,

    CONSTRAINT pk_sessions
        PRIMARY KEY (session_id)

) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
