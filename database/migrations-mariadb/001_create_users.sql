-- UniGO! Database Migration
-- Migration: 001_create_users
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Requires team schema approval before execution.

CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    username VARCHAR(30) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    session_version INT UNSIGNED NOT NULL DEFAULT 0,

    email_verified_at DATETIME NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_users PRIMARY KEY (id),

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)

) ENGINE=InnoDB
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;