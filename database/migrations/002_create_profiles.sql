
-- UniGO! Database Migration
-- Migration: 002_create_profiles
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Requires team schema approval.
-- Dependency: 001_create_users.sql
-- university_name is provisional.
-- FK deletion policy is pending approval.

CREATE TABLE profiles (
    user_id BIGINT UNSIGNED NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NULL,

    avatar_url VARCHAR(500) NULL,
    bio TEXT NULL,
    status_text VARCHAR(100) NULL,

    education_type VARCHAR(20) NULL,
    age TINYINT UNSIGNED NULL,

    school_name VARCHAR(200) NULL,
    grade_level VARCHAR(30) NULL,

    university_name VARCHAR(200) NULL,
    university_year TINYINT UNSIGNED NULL,

    contact_visibility VARCHAR(20)
        NOT NULL DEFAULT 'private',

    onboarding_completed_at DATETIME NULL
        DEFAULT NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_profiles
        PRIMARY KEY (user_id),

    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT

) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
