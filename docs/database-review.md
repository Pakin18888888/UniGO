
# UniGO! Database Final Review

## 1. Review Status
- Project: UniGO!
- Database: MySQL
- Main schema: docs/database-schema.md
- Branch: feature/auth-api-kin
- Total designed tables: 15
- Status: DRAFT - Pending final approval

## 2. Foreign Key Review

| Child Table | Foreign Key | Parent Table |
|---|---|---|
| profiles | user_id | users.id |
| posts | user_id | users.id |
| post_media | post_id | posts.id |
| comments | user_id | users.id |
| comments | post_id | posts.id |
| post_likes | user_id | users.id |
| post_likes | post_id | posts.id |
| follows | follower_id | users.id |
| follows | following_id | users.id |
| post_hashtags | post_id | posts.id |
| post_hashtags | hashtag_id | hashtags.id |
| post_reports | post_id | posts.id |
| post_reports | reporter_id | users.id |
| post_reports | reviewed_by | users.id |
| portfolios | user_id | users.id |
| portfolio_items | portfolio_id | portfolios.id |
| password_reset_tokens | user_id | users.id |
| admin_audit_logs | actor_user_id | users.id |

### Foreign Key Rules
- Parent and child ID types must match.
- Shared user IDs use BIGINT UNSIGNED.
- Nullable relationships must allow NULL.
- All referenced parent records must exist.
- Final ON DELETE rules are pending.
- Review account deletion behavior before migration.

## 3. Special Cases

### Sessions
- Follows the selected MySQL session store schema.
- Does not use a direct users foreign key.
- User identity is validated by backend middleware.

### Admin Audit Logs
- actor_user_id references users.id.
- target_id is polymorphic and has no direct FK.
- Preserve audit history according to policy.

### University Integration
- Coordinate with Ball.
- Current profiles.university_name is provisional.
- Decide whether universities.id will be referenced.
- Confirm the final shared ID type.

## 4. Pending Decisions
- Foreign key ON DELETE actions
- Soft-delete and hard-delete behavior
- User account deletion policy
- University table relationship
- Audit log retention policy
- MySQL version and collation
- BIGINT serialization in JSON APIs

## 5. Final Approval
- Kin Backend Review: Pending
- Ball Database Integration: Pending
- SQL Migration Review: Pending
- API Contract Review: Pending

Do not execute the final SQL schema
until the required decisions are resolved.

---

## 6. Proposed ON DELETE Rules

Status: PROPOSED - Pending team approval

These rules apply to physical SQL DELETE operations.
Soft deletes do not trigger foreign key ON DELETE actions.

| Child Table | FK Column | Parent | ON DELETE |
|---|---|---|---|
| profiles | user_id | users.id | RESTRICT |
| posts | user_id | users.id | RESTRICT |
| post_media | post_id | posts.id | CASCADE |
| comments | user_id | users.id | RESTRICT |
| comments | post_id | posts.id | RESTRICT |
| post_likes | user_id | users.id | CASCADE |
| post_likes | post_id | posts.id | CASCADE |
| follows | follower_id | users.id | CASCADE |
| follows | following_id | users.id | CASCADE |
| post_hashtags | post_id | posts.id | CASCADE |
| post_hashtags | hashtag_id | hashtags.id | CASCADE |
| post_reports | post_id | posts.id | RESTRICT |
| post_reports | reporter_id | users.id | RESTRICT |
| post_reports | reviewed_by | users.id | RESTRICT |
| portfolios | user_id | users.id | RESTRICT |
| portfolio_items | portfolio_id | portfolios.id | CASCADE |
| password_reset_tokens | user_id | users.id | CASCADE |
| admin_audit_logs | actor_user_id | users.id | RESTRICT |

### Design Principles
- RESTRICT prevents accidental loss of important data.
- CASCADE is proposed for dependent relationship rows.
- SET NULL is not selected in this initial proposal.
- All rules require review before SQL migration.
- ON UPDATE is proposed as RESTRICT because
  primary identifiers must not normally change.

### Special Notes
- post_reports.reviewed_by is nullable,
  but RESTRICT is proposed to preserve reviewer identity.
- admin_audit_logs.actor_user_id uses RESTRICT
  to preserve administrative accountability.
- post_media and portfolio_items may reference
  files stored outside MySQL.
- CASCADE does not automatically delete those files.
- File cleanup requires a separate safe process.

---

## 7. Deletion Scenarios

### Scenario A: User Deactivation
- Set users.is_active = FALSE.
- Deny future authenticated API requests.
- Revoke active sessions.
- Public content visibility must follow policy.
- Do not physically delete the users row.
- Preserve related records according to policy.

### Scenario B: Post Soft Delete
- Set posts.deleted_at to the current UTC time.
- Keep related comments, likes and reports stored.
- Hide the post from public feeds and searches.
- Allow authorized recovery where appropriate.
- ON DELETE CASCADE is not triggered.

### Scenario C: Post Hard Delete
- Require an authorized permanent-deletion process.
- Review reports and comments before deletion.
- RESTRICT may prevent deletion while records exist.
- Resolve retention requirements first.
- After restrictions are resolved, CASCADE can
  remove dependent media references, likes and tags.
- Clean up external media files separately.
- Use a transaction for database changes.

### Scenario D: Portfolio Soft Delete
- Set portfolios.deleted_at.
- Hide all associated portfolio items publicly.
- Keep items stored for possible restoration.
- Do not trigger ON DELETE CASCADE.

### Scenario E: Portfolio Hard Delete
- Require authorization and retention review.
- Deleting the parent may CASCADE to items.
- External image files require separate cleanup.
- Handle failed file cleanup safely.

### Scenario F: User Hard Delete
- Do not directly DELETE users from normal APIs.
- RESTRICT intentionally blocks unsafe deletion.
- Define a controlled account-erasure process.
- Review posts, reports and audit records.
- Consider anonymization where appropriate.
- Establish privacy and retention requirements.
- Revoke sessions and credentials.
- Finalize this workflow before production.

---

## 8. Pending Deletion Policy Approval

- Kin: Review proposed ON DELETE actions.
- Ball: Review shared user and university references.
- Team: Agree on account deletion behavior.
- Team: Agree on retention of reports and audit logs.
- Team: Confirm external media cleanup strategy.
- SQL implementation: NOT STARTED.

Do not apply these rules to a live database
until the complete schema has been approved.

---

## 9. Data Type, Constraint and Index Review

Status: DRAFT - Pending SQL implementation

### 9.1 Data Type Rules
- Primary IDs use BIGINT UNSIGNED.
- Foreign key ID types must match parent IDs.
- Serialize BIGINT IDs as strings in JSON APIs.
- Configure mysql2 to preserve large integer values.
- Use utf8mb4 for Unicode text.
- Confirm MySQL server version before selecting collation.
- Choose case-insensitive uniqueness for usernames
  and normalized emails.
- Use binary or case-sensitive comparison for
  session identifiers and token hashes.
- Validate VARCHAR lengths at the backend.
- Validate application limits for TEXT fields.
- Validate allowed numeric ranges.
- Define a consistent UTC date-time policy.
- Review TIMESTAMP versus DATETIME before migration.

### 9.2 Primary Key and Unique Constraints
- users.id: PRIMARY KEY
- users.username: UNIQUE
- users.email: UNIQUE
- profiles.user_id: PRIMARY KEY and FOREIGN KEY
- posts.id: PRIMARY KEY
- post_media.id: PRIMARY KEY
- comments.id: PRIMARY KEY
- post_likes: PRIMARY KEY (post_id, user_id)
- follows: PRIMARY KEY (follower_id, following_id)
- hashtags.id: PRIMARY KEY
- hashtags.name: UNIQUE
- post_hashtags: PRIMARY KEY (post_id, hashtag_id)
- post_reports.id: PRIMARY KEY
- post_reports: UNIQUE (post_id, reporter_id)
- portfolios.id: PRIMARY KEY
- portfolios.user_id: UNIQUE
- portfolio_items.id: PRIMARY KEY
- password_reset_tokens.id: PRIMARY KEY
- password_reset_tokens.token_hash: UNIQUE
- sessions.session_id: PRIMARY KEY
- admin_audit_logs.id: PRIMARY KEY

### 9.3 Index Review
Required indexes must support:
- User authentication lookup
- Posts by owner and creation time
- Public Feed pagination
- Comments by post
- Likes by post and user
- Followers and following lists
- Hashtag search
- Report queue filtering
- Portfolio item ordering
- Password reset lookup
- Admin audit log filtering

Review existing proposed indexes in database-schema.md.

Avoid unnecessary duplicate indexes.
Use EXPLAIN after implementing real SQL queries.
Final index approval is pending.

### 9.4 Validation Rules
- Username and email must be validated.
- Password must follow the agreed security policy.
- Public registration cannot assign admin role.
- Education type must match onboarding information.
- Post creation requires text or media.
- Comments must not be empty.
- Duplicate Likes and Follows are not allowed.
- Self-follow must be rejected by backend validation.
- Duplicate Reports are not allowed.
- Portfolio ownership must be verified.
- Reset tokens must expire and be single-use.
- Session authorization must be checked server-side.
- Admin actions must be authorized and audited.

### 9.5 CHECK Constraint Compatibility
- Confirm the MySQL version.
- Use CHECK for suitable allowed-value constraints.
- Review CHECK compatibility with FK referential actions.
- For follows, enforce the self-follow rule in backend
  validation because CASCADE is proposed for its FKs.
- Do not assume all CHECK constraints work on every
  MySQL version or configuration.
- Test each actual SQL constraint before approval.

### 9.6 Pending Design Decisions
- Final email and username collation
- Hashtag Unicode normalization
- Session ID and reset token collation
- Timestamp versus datetime policy
- Maximum upload sizes and content limits
- Final feed pagination indexes
- Final foreign key actions
- Exact MySQL version
- University ID relationship with Ball
- Final supported CHECK constraints

### 9.7 Review Status
- Logical design: Completed as draft
- Column review: Pending final approval
- Constraint review: Pending SQL testing
- Index review: Pending query testing
- MySQL migration: Not started

---

## 10. Shared Database Integration Agreement

Status: PENDING TEAM CONFIRMATION

### 10.1 Shared User Identity
- Proposed shared user ID: BIGINT UNSIGNED.
- Main user table: users.
- Backend owns authentication and authorization.
- All modules must use the same user identity.
- JSON APIs should serialize BIGINT IDs as strings.

### 10.2 University Integration
Pending confirmation with Ball:
- University table name
- University primary key name and type
- Whether profiles should use university_id
- University lookup API design
- Handling of students without a university
- Relationship and deletion rules

### 10.3 Database Ownership
- Kin: Auth, Profile, Feed, Portfolio, Admin.
- Ball: University, Exam, Chat.
- Shared tables require coordination.
- Migrations must be reviewed before merging.
- Do not modify another member's tables
  without agreement.

### 10.4 Development Environment
- MySQL server version: PENDING
- Local MySQL availability: PENDING
- Database name: unigo_db (proposed)
- Character set: utf8mb4
- Final collation: PENDING
- Production hosting: PENDING

### 10.5 Approval Status
- Kin's logical design: DRAFT COMPLETE
- Ball's integration review: PENDING
- Foreign key policy: PROPOSED
- SQL compatibility testing: NOT STARTED
- API Contract: NOT STARTED
- Final schema approval: PENDING

The database design must be confirmed before
running final SQL migrations.
