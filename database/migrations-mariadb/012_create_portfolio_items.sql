-- UniGO! Database Migration
-- Migration: 012_create_portfolio_items
-- MySQL Version: 8.4
-- Owner: Kin
-- Status: DRAFT - DO NOT EXECUTE
-- Source: uploaded 15-table database-schema(1).md
-- Approval: database-review.md FK policies are PROPOSED, not approved.
-- Dependencies: portfolios
-- Image keys refer to external storage; CASCADE does not delete files.

CREATE TABLE portfolio_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    portfolio_id BIGINT UNSIGNED NOT NULL,

    item_type VARCHAR(30) NOT NULL,

    title VARCHAR(150) NOT NULL,

    description TEXT NULL,

    image_key VARCHAR(500) NULL,

    external_url VARCHAR(2048) NULL,

    sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,

    CONSTRAINT pk_portfolio_items PRIMARY KEY (id),

    CONSTRAINT fk_portfolio_items_portfolio_id FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE ON UPDATE RESTRICT,

    INDEX idx_portfolio_items_portfolio_id_sort_order_id (portfolio_id, sort_order, id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
