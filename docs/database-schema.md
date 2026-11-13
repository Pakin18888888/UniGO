
# UniGO! Database Design

## Database
- Name: unigo_db
- Engine: MySQL
- Character Set: utf8mb4
- Storage Engine: InnoDB

## Shared Rules
- Use a single shared database.
- users.id is the primary user identifier.
- All modules reference the same users table.
- Passwords must be stored as secure hashes.
- Use foreign keys for relationships.
- Use unique constraints where necessary.
- Use created_at and updated_at timestamps.
- Use database migrations for schema changes.

## Kin's Tables
### Authentication
- users
- password_reset_tokens
- sessions

### Profile
- profiles
- follows

### Feed
- posts
- post_media
- post_likes
- comments
- hashtags
- post_hashtags
- post_reports

### Portfolio
- portfolios
- portfolio_items

### Admin
- admin_audit_logs

## Ball's Tables
- University tables (to be confirmed)
- Exam tables (to be confirmed)
- Chat tables (to be confirmed)

## Important Decisions
- Separate education type from system role.
- Define the users.id data type before other modules.
- Define foreign keys before writing migrations.
- Never expose password hashes through APIs.
- Protect private profile information.

## users Table Design

Purpose:
Store authentication information and account permissions.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| username | VARCHAR(30) | NOT NULL, UNIQUE |
| email | VARCHAR(254) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'user' |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE |
| email_verified_at | DATETIME | NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### Validation
- Username: 3-30 characters; allowed characters to be finalized.
- Email: must have valid format and be unique.
- Normalize email before storing.
- Password: validate according to the agreed password policy.
- Hash passwords using a secure password-hashing algorithm.
- Never store plaintext passwords.
- Public registration always assigns role = 'user'.
- Admin permissions must be granted through a protected process.

### Relationships
- users.id -> profiles.user_id
- users.id -> posts.user_id
- users.id -> comments.user_id
- users.id -> portfolios.user_id

### Notes
- Use BIGINT UNSIGNED as the shared User ID type.
- Apply case-insensitive uniqueness rules for email and username.
- Use parameterized SQL queries.
- Never return password_hash in API responses.
- Final schema must be reviewed with Ball before migrations.

## profiles Table Design

Purpose:
Store user profile information, education details,
and onboarding status.

| Column | Type | Constraints |
|---|---|---|
| user_id | BIGINT UNSIGNED | PRIMARY KEY, FOREIGN KEY |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| display_name | VARCHAR(100) | NULL |
| avatar_url | VARCHAR(500) | NULL |
| bio | TEXT | NULL |
| status_text | VARCHAR(100) | NULL |
| education_type | VARCHAR(20) | NULL |
| age | TINYINT UNSIGNED | NULL |
| school_name | VARCHAR(200) | NULL |
| grade_level | VARCHAR(30) | NULL |
| university_name | VARCHAR(200) | NULL |
| university_year | TINYINT UNSIGNED | NULL |
| contact_visibility | VARCHAR(20) | NOT NULL, DEFAULT 'private' |
| onboarding_completed_at | DATETIME | NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### Relationships
- profiles.user_id references users.id
- Each user has exactly one main profile.
- Registration creates users and profiles in one transaction.

### Education Types
- school: Student in school
- university: University student

### School Student
Required during onboarding:
- education_type = 'school'
- age
- school_name
- grade_level

### University Student
Required during onboarding:
- education_type = 'university'
- age
- university_name
- university_year

### Onboarding Rules
- education_type is initially NULL.
- onboarding_completed_at is initially NULL.
- A user must finish onboarding before accessing
  features that require a completed profile.
- Validate education-specific fields on the server.
- Reject conflicting school and university fields.
- Validate age against the agreed policy.

### Profile Privacy
- contact_visibility:
  private, followers, public
- Default contact visibility is private.
- Never expose private contact data without permission.
- Avatar uploads must validate file type and size.
- Store a file reference, not binary image data.

### Design Notes
- university_name is provisional.
- Coordinate university_id with Ball before SQL migration.
- Age must be refreshed when no longer current.
- Define allowed values in backend validation.
- Decide supported grade levels with the team.

## posts Table Design

Purpose:
Store text posts created by UniGO users.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| user_id | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY |
| content | TEXT | NULL |
| moderation_status | VARCHAR(20) | NOT NULL, DEFAULT 'visible' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| deleted_at | DATETIME | NULL |

### Relationships
- posts.user_id references users.id
- One user can create many posts.
- One post can contain many media files.
- One post can have many comments and likes.

### Validation Rules
- User must be authenticated to create posts.
- A post must contain text or at least one image.
- Text length must follow the agreed application limit.
- Only the owner can edit or delete their own post.
- Admin can moderate posts through protected APIs.
- Deleted posts must not appear in the public feed.
- Validate and sanitize content appropriately.
- Do not trust user_id supplied by the frontend.

### Moderation
Allowed statuses:
- visible
- hidden

### Indexes
- Index posts(user_id, created_at)
- Index posts(created_at)

---

## post_media Table Design

Purpose:
Store image references associated with posts.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| post_id | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY |
| file_key | VARCHAR(500) | NOT NULL |
| mime_type | VARCHAR(100) | NOT NULL |
| sort_order | SMALLINT UNSIGNED | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Relationships
- post_media.post_id references posts.id
- One post can have multiple media files.

### Upload Rules
- Images only in the initial version.
- Validate real file type and file size.
- Define maximum images per post.
- Generate safe unique file names.
- Store trusted file references.
- Do not execute uploaded files.
- Only post owners can add or remove media.
- Check permissions on all media operations.

### Indexes
- Index post_media(post_id, sort_order)

### Important Notes
- Enforce post ownership in the backend.
- Use parameterized SQL queries.
- Media files are stored separately from MySQL.
- API should return usable media URLs.
- Final foreign key behavior must be reviewed
  before writing SQL migrations.

---

## comments Table Design

Purpose:
Store comments created by users on posts.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| post_id | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY |
| user_id | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY |
| content | TEXT | NOT NULL |
| moderation_status | VARCHAR(20) | NOT NULL, DEFAULT 'visible' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| deleted_at | DATETIME | NULL |

### Relationships
- comments.post_id references posts.id
- comments.user_id references users.id
- One post can have multiple comments.
- One user can write multiple comments.

### Validation Rules
- Authentication is required.
- Content must not be empty after trimming.
- Proposed content limit: 1-2000 characters.
- The target post must exist and be visible.
- The target post must not be soft-deleted.
- Only the owner can edit their own comment.
- Only the owner can delete their own comment.
- Admin can hide comments through protected APIs.
- Never trust user_id from the frontend.

### Moderation
Allowed statuses:
- visible
- hidden

### Delete Rules
- Use soft delete with deleted_at.
- Deleted comments must not appear publicly.
- Final hard-delete behavior must be reviewed.

### Indexes
- Index comments(post_id, created_at, id)
- Index comments(user_id)

### Initial Scope
- Flat comments only.
- Nested replies may be added in a future version.

---

## post_likes Table Design

Purpose:
Record which users like which posts.

| Column | Type | Constraints |
|---|---|---|
| post_id | BIGINT UNSIGNED | PRIMARY KEY, FOREIGN KEY |
| user_id | BIGINT UNSIGNED | PRIMARY KEY, FOREIGN KEY |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Primary Key
- Composite PRIMARY KEY (post_id, user_id)
- Prevents duplicate likes by the same user.

### Relationships
- post_likes.post_id references posts.id
- post_likes.user_id references users.id
- One post can receive likes from many users.
- One user can like many posts.

### Like Rules
- Authentication is required.
- Only visible, non-deleted posts can be liked.
- Get user_id from the authenticated session.
- Never trust user_id supplied by the frontend.
- Duplicate like requests must not create duplicates.
- A repeated like may be treated as a no-op.

### Unlike Rules
- Remove only the authenticated user's like.
- Repeated unlike requests may be treated as a no-op.
- Users cannot remove another user's like.

### Like Count
- Count rows matching the target post_id.
- Do not store like_count in posts initially.
- Consider caching only if performance requires it.

### Indexes
- Composite PRIMARY KEY (post_id, user_id)
- Index post_likes(user_id)

### Security
- Use parameterized SQL queries.
- Check session authentication.
- Validate post existence and visibility.
- Apply rate limiting where appropriate.

### Design Notes
- Final foreign key ON DELETE rules are pending.
- Soft-deleted posts must not accept new likes.
- All timestamps should follow one UTC strategy.

---

## follows Table Design

Purpose:
Store follow relationships between UniGO users.

| Column | Type | Constraints |
|---|---|---|
| follower_id | BIGINT UNSIGNED | PRIMARY KEY, FOREIGN KEY |
| following_id | BIGINT UNSIGNED | PRIMARY KEY, FOREIGN KEY |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Primary Key
- Composite PRIMARY KEY (follower_id, following_id).
- Prevent duplicate follow relationships.
- A follow relationship is directional.

### Relationships
- follows.follower_id references users.id.
- follows.following_id references users.id.
- One user can follow many users.
- One user can have many followers.

### Follow Rules
- Authentication is required.
- Users cannot follow themselves.
- The target user must exist.
- The target account must be active.
- Use follower_id from the authenticated session.
- Never trust follower_id supplied by the frontend.
- Duplicate follow requests must not create duplicates.
- Repeated follow requests may be treated as a no-op.

### Unfollow Rules
- Users can unfollow other users.
- Remove only the authenticated user's follow relationship.
- Repeated unfollow requests may be treated as a no-op.
- Users cannot remove another user's follow relationship.

### Following Count
Count rows where:
- follower_id = target user ID

### Followers Count
Count rows where:
- following_id = target user ID

### Indexes
- Composite PRIMARY KEY (follower_id, following_id)
- Index follows(following_id, follower_id)

### Privacy and Security
- Follow relationships are public in the initial version.
- Contact visibility does not grant follow approval.
- Private accounts and follow requests are out of scope initially.
- Blocked-user behavior must be defined if blocking is added.
- Use parameterized SQL queries.
- Validate authentication and authorization.
- Prevent self-follow in backend validation.
- Add a database CHECK constraint where supported.

### Delete Rules
- Unfollow deletes the relationship row.
- User-account deletion behavior must be decided
  before implementing foreign keys.

### Design Notes
- Do not store follower_count in profiles initially.
- Do not store following_count in profiles initially.
- Calculate counts using SQL queries.
- Final foreign key ON DELETE rules are pending.

---

## hashtags Table Design

Purpose:
Store unique hashtags used in UniGO posts.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(60) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Hashtag Naming Rules
- Store the name without the # symbol.
- Normalize hashtag names before saving.
- Hashtag matching must be case-insensitive.
- Example: #Portfolio and #portfolio refer to one hashtag.
- Support Unicode hashtags, including Thai.
- Proposed maximum length: 50 Unicode characters.
- Only allow agreed characters such as letters, numbers and underscores.
- Reject empty and invalid hashtag names.
- Enforce uniqueness at the database level.

### Relationships
- One hashtag can belong to multiple posts.
- Hashtags connect to posts through post_hashtags.

### Indexes
- UNIQUE INDEX on hashtags(name).

### Search Rules
- Searching by hashtag should return matching posts.
- Return only visible, non-deleted posts.
- Do not display posts belonging to inactive users.
- Sort results using a consistent order.
- Support pagination.

### Design Notes
- Hashtags can be created automatically from post content.
- Reuse existing hashtags instead of creating duplicates.
- The exact Unicode normalization and collation policy
  must be finalized before SQL migration.
- Do not store hashtag usage counts initially.
- Do not expose hidden posts through hashtag search.

---

## post_hashtags Table Design

Purpose:
Connect UniGO posts to their hashtags.

| Column | Type | Constraints |
|---|---|---|
| post_id | BIGINT UNSIGNED | PRIMARY KEY, FOREIGN KEY |
| hashtag_id | BIGINT UNSIGNED | PRIMARY KEY, FOREIGN KEY |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Primary Key
- Composite PRIMARY KEY (post_id, hashtag_id).
- Prevent duplicate hashtags on the same post.

### Relationships
- post_hashtags.post_id references posts.id.
- post_hashtags.hashtag_id references hashtags.id.
- One post can contain multiple hashtags.
- One hashtag can be used in multiple posts.
- Relationship type: Many-to-Many (M:N).

### Create Post Rules
- Extract hashtags from the post text.
- Normalize hashtag names consistently.
- Remove duplicate hashtags from the same post.
- Find or create each hashtag in the database.
- Create post_hashtags relationships.
- Use a database transaction for related writes.
- Handle concurrent hashtag creation safely.

### Edit Post Rules
- Re-extract hashtags when post content changes.
- Add new hashtag relationships.
- Remove relationships no longer used.
- Keep the relationship set synchronized with content.

### Delete Post Rules
- Soft-deleted posts must be excluded from search.
- Preserve relationships while a post is restorable.
- Define cleanup behavior for permanent deletion.

### Search Rules
- Find post IDs from hashtag relationships.
- Join with posts to retrieve visible posts.
- Exclude soft-deleted and hidden posts.
- Support pagination and sorting.

### Indexes
- Composite PRIMARY KEY (post_id, hashtag_id).
- Index post_hashtags(hashtag_id, post_id).

### Security
- Only the post owner can edit their hashtags.
- Authentication is required for post modification.
- Never trust post ownership from the frontend.
- Use parameterized SQL queries.
- Validate hashtag length and format.
- Apply rate limits where appropriate.

### Design Notes
- Maximum hashtags per post: proposed 10.
- Store normalized hashtags only once.
- Do not store duplicate relationship rows.
- Final foreign key behavior must be reviewed.

---

## post_reports Table Design

Purpose:
Store reports submitted by users about inappropriate
or potentially rule-violating posts.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| post_id | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY |
| reporter_id | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY |
| reason | VARCHAR(30) | NOT NULL |
| description | TEXT | NULL |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' |
| reviewed_by | BIGINT UNSIGNED | NULL, FOREIGN KEY |
| admin_note | TEXT | NULL |
| reviewed_at | DATETIME | NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

### Relationships
- post_reports.post_id references posts.id.
- post_reports.reporter_id references users.id.
- post_reports.reviewed_by references users.id.
- One post can receive multiple reports.
- One user can report multiple posts.
- One admin can review multiple reports.

### Unique Constraint
- UNIQUE (post_id, reporter_id).
- Prevent multiple reports from the same user
  about the same post.
- Duplicate requests must not create new reports.
- Reviewed reports must not be silently overwritten.

### Report Reasons
Allowed values:
- spam
- harassment
- inappropriate
- misinformation
- other

### Report Status
Allowed values:
- pending
- dismissed
- action_taken

### Create Report Rules
- Authentication is required.
- The reported post must exist.
- The reported post must not be soft-deleted.
- The reported post must be visible.
- Users cannot report their own posts.
- Use reporter_id from the authenticated session.
- Never trust reporter_id provided by the frontend.
- The reason must match an allowed value.
- Proposed description limit: 1000 characters.
- A repeated report must not create a new row.
- Creating a report does not automatically hide a post.

### Admin Review Rules
- Admin authentication and authorization are required.
- Only authorized admins can review reports.
- Admin can dismiss a report.
- Admin can take moderation action on a post.
- Update reviewed_by and reviewed_at when reviewed.
- Store a review note when appropriate.
- Prevent unauthorized report status changes.
- Do not trust admin role claims from the frontend.
- Validate report state transitions.

### Moderation Relationship
- post_reports.status represents report review state.
- posts.moderation_status represents post visibility.
- Reporting does not automatically change visibility.
- Hide a post only through an authorized decision.
- Update related records transactionally when needed.
- Record administrative actions in admin_audit_logs.

### Privacy Rules
- Reporter identity must not be shown to post authors.
- Regular users cannot list other users' reports.
- Admin-only fields must not appear in public APIs.
- Report descriptions may contain sensitive information.
- Restrict access to report and moderation data.
- Define a report retention policy before production.

### Indexes
- PRIMARY KEY (id)
- UNIQUE (post_id, reporter_id)
- Index post_reports(status, created_at, id)
- Index post_reports(reporter_id)
- Index post_reports(reviewed_by)

### Delete Rules
- Deleting a report must require an authorized process.
- User and post deletion behavior must be decided.
- Final foreign key ON DELETE rules are pending.

### Security
- Use parameterized SQL queries.
- Validate all request fields.
- Apply rate limiting to report creation.
- Check permissions for every Admin API.
- Never expose private moderation notes publicly.

### Initial Scope
- Reports apply to posts only.
- One report per user per post.
- Three report statuses.
- Manual Admin review.
- No automatic post removal based on report count.

### Design Notes
- Comment reports may be added later.
- Report appeals may be added in a future version.
- Database CHECK constraints should be considered
  for status and reason values.
- Final schema requires review before SQL migration.
