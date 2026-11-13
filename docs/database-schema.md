
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
| session_version | INT UNSIGNED | NOT NULL, DEFAULT 0 |
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

---

## portfolios Table Design

Purpose:
Store a user's main portfolio and its visibility settings.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| user_id | BIGINT UNSIGNED | NOT NULL, UNIQUE, FOREIGN KEY |
| title | VARCHAR(150) | NOT NULL |
| summary | TEXT | NULL |
| visibility | VARCHAR(20) | NOT NULL, DEFAULT 'private' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| deleted_at | DATETIME | NULL |

### Relationships
- portfolios.user_id references users.id.
- One user can have at most one main portfolio.
- One portfolio can contain multiple portfolio_items.

### Unique Constraint
- UNIQUE (user_id)
- Prevent duplicate main portfolios for one user.

### Visibility
Allowed values:
- private
- public

### Portfolio Rules
- Authentication is required to create a portfolio.
- The owner can view and edit their own portfolio.
- Public portfolios can be viewed by other users.
- Private portfolios are visible only to the owner
  and explicitly authorized moderation processes.
- The owner can change visibility.
- Admin access must be protected and audited.
- A soft-deleted portfolio is not publicly visible.
- Reuse or restore a soft-deleted portfolio instead
  of inserting a second row for the same user.

### Validation
- Title is required and must not be empty.
- Proposed title limit: 150 characters.
- Proposed summary limit: 3000 characters.
- Validate all fields on the server.
- Use user_id from the authenticated session.
- Never trust ownership claims from the frontend.

### Indexes
- PRIMARY KEY (id)
- UNIQUE (user_id)
- Index portfolios(visibility, created_at)

### Delete Rules
- Use soft delete with deleted_at.
- Hide all items when the parent portfolio is deleted.
- Hard-delete and foreign key behavior are pending.

### Security
- Use parameterized SQL queries.
- Enforce ownership in the backend.
- Protect private portfolio data.
- Escape user-provided content when rendering.

---

## portfolio_items Table Design

Purpose:
Store projects, certificates, and activities
inside a user's portfolio.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| portfolio_id | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY |
| item_type | VARCHAR(30) | NOT NULL |
| title | VARCHAR(150) | NOT NULL |
| description | TEXT | NULL |
| image_key | VARCHAR(500) | NULL |
| external_url | VARCHAR(2048) | NULL |
| sort_order | SMALLINT UNSIGNED | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| deleted_at | DATETIME | NULL |

### Relationships
- portfolio_items.portfolio_id references portfolios.id.
- One portfolio can contain multiple items.
- Each item belongs to exactly one portfolio.

### Item Types
Allowed values:
- project
- certificate
- activity

### Create Item Rules
- Authentication is required.
- The portfolio must exist and be active.
- Only the portfolio owner can create items.
- Title and item_type are required.
- item_type must match an allowed value.
- Proposed maximum items: 30 per portfolio.
- Validate and sanitize user input appropriately.

### Edit Item Rules
- Only the portfolio owner can edit an item.
- The item must belong to the owner's portfolio.
- Users can change title, description and item type.
- Users can update image and external URL.
- Users can reorder items using sort_order.

### Delete Item Rules
- Use soft delete with deleted_at.
- Soft-deleted items must not appear publicly.
- The owner may restore an item.
- Permanent cleanup behavior is pending.

### Visibility Rules
- Items inherit visibility from their parent portfolio.
- Private portfolios do not expose items publicly.
- Deleted portfolios do not expose items publicly.
- Deleted items must not appear in portfolio responses.

### Image Rules
- Image uploads are optional.
- Validate actual file type and file size.
- Use generated safe file names.
- Store file references, not binary data in MySQL.
- Prevent uploaded files from executing as code.
- Clean up unused uploaded files safely.

### External URL Rules
- External links are optional.
- Accept only approved schemes such as HTTPS.
- Validate URL length and format.
- Do not allow javascript: or other unsafe schemes.
- Use appropriate safety attributes for external links.

### Indexes
- PRIMARY KEY (id)
- Index portfolio_items(portfolio_id, sort_order, id)

### Security
- Use parameterized SQL queries.
- Validate authentication and ownership.
- Never trust portfolio ownership from the frontend.
- Prevent unauthorized item modifications.
- Apply file upload limits.
![alt text](image.png)
### Design Notes
- One image per item in the initial version.
- Multiple images can be added later using
  a separate portfolio_item_media table.
- Final foreign key ON DELETE rules are pending.
- Physical file cleanup must handle failed operations.

---

## password_reset_tokens Table Design

Purpose:
Store secure password reset token hashes
for account recovery.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| user_id | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY |
| token_hash | CHAR(64) | NOT NULL, UNIQUE |
| expires_at | DATETIME | NOT NULL |
| used_at | DATETIME | NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Relationships
- password_reset_tokens.user_id references users.id.
- One user can request multiple password resets.
- Each reset token belongs to one user.

### Token Generation
- Generate reset tokens using a cryptographically
  secure random number generator.
- Use at least 32 random bytes per token.
- Store a SHA-256 hash of the random token.
- Never store the original token in MySQL.
- Never log or expose the original token.
- Use a consistent binary-safe token encoding.
- Store SHA-256 hexadecimal hashes as CHAR(64)
  with a case-sensitive or binary comparison.

### Token Expiration
- Proposed expiration: 30 minutes.
- All expiration comparisons use UTC.
- Reject expired tokens.
- Reject tokens that have already been used.
- A token can successfully reset a password once.

### Reset Request Rules
- Apply rate limiting to reset requests.
- Do not reveal whether an email is registered.
- Send reset links only to the registered email.
- Do not return the reset token in the API response.
- The frontend must not supply user_id.
- Generate the reset URL using a trusted base URL.

### Password Reset Rules
- Hash the incoming token before database lookup.
- Validate expiration and usage status.
- Validate the new password against password policy.
- Hash the new password using Argon2id or bcrypt.
- Never store plaintext passwords.
- Update the password and consume the token
  atomically in a database transaction.
- Prevent concurrent reuse of the same token.
- Invalidate all other outstanding reset tokens
  belonging to the same user.
- Revoke or invalidate existing login sessions
  according to the agreed security policy.

### Token Storage Rules
- UNIQUE (token_hash)
- Use parameterized SQL queries.
- Restrict access to reset token records.
- Expired and used tokens may be cleaned up
  through a scheduled maintenance process.

### Indexes
- PRIMARY KEY (id)
- UNIQUE (token_hash)
- Index password_reset_tokens(user_id, expires_at)

### Security
- Avoid leaking reset tokens through application logs.
- Do not expose token hashes in API responses.
- Avoid third-party scripts on password reset pages.
- Use HTTPS in production.
- Configure an appropriate Referrer-Policy.
- Treat reset tokens as sensitive credentials.

### Delete Rules
- Final user deletion and foreign key rules
  must be reviewed before SQL migration.

### Design Notes
- Email delivery integration is required.
- The reset email must have a clear expiry notice.
- The final expiration policy must be agreed upon.
- Database implementation is pending.

---

## sessions Table Design

Purpose:
Store server-side login sessions for UniGO users.

### Session Technology
- Session middleware: express-session
- Database store: express-mysql-session
- Database: MySQL
- Database driver: mysql2
- Authentication method: Server-side session
- Session transport: HTTP Cookie

### Table Structure

| Column | Type | Constraints |
|---|---|---|
| session_id | VARCHAR(128) | PRIMARY KEY, NOT NULL |
| expires | INT UNSIGNED | NOT NULL |
| data | MEDIUMTEXT | NULL |

### Primary Key
- PRIMARY KEY (session_id)
- Use a binary or case-sensitive collation
  for the session_id column.
- Session IDs must be unpredictable.

### Session Storage Rules
- Follow the selected session store's schema.
- Store session information on the server.
- Store only a session identifier in the cookie.
- Session data must not contain plaintext passwords.
- Do not store password_hash in session data.
- Store only necessary authentication information.
- Session records must expire automatically.
- Restrict database access to session records.

### Session Data
Proposed application fields:
- userId
- authenticatedAt
- sessionVersion

The session store may also store cookie metadata.

### Session Version Design
- Add users.session_version to the users design
  before the final SQL migration.
- Proposed type: INT UNSIGNED NOT NULL DEFAULT 0.
- Copy the current version into the session at login.
- Compare the saved version with the database
  version during authenticated requests.
- Increment the user version when all sessions
  must be revoked.
- This is a proposed application-level mechanism,
  not a default feature of express-mysql-session.

### Login Rules
- Validate username/email and password.
- Reject inactive accounts.
- Regenerate the session ID after login.
- Store the authenticated user ID in the session.
- Never accept a user ID from the frontend
  as proof of authentication.
- Do not save passwords in session data.

### Remember Me
Proposed policy:
- Normal login: 2-hour server-side idle timeout.
- Remember Me: persistent session, up to 7 days.
- Enforce server-side expiration.
- Configure cookie lifetime appropriately.
- Enforce an absolute session lifetime as well.
- Final timeout values must be agreed upon.

### Cookie Security
- HttpOnly: true
- Secure: true in HTTPS production
- SameSite: Lax for compatible deployment
- Path: /
- Avoid unnecessarily broad Domain attributes.
- Review cross-site deployment requirements.
- Protect state-changing requests against CSRF.

### Logout Rules
- Destroy the server-side session.
- Clear the matching session cookie.
- Do not rely only on deleting browser cookies.
- Repeated logout requests must not expose secrets.

### Authorization Rules
- Check authentication for protected APIs.
- Check active account status.
- Validate the session version.
- Verify admin role using trusted server data.
- Never trust a role submitted by the frontend.
- Reject unauthorized access with 403.
- Reject unauthenticated access with 401.

### Password Reset Integration
- Password reset must revoke old login sessions.
- Use session_version or a verified equivalent.
- Require fresh login after password reset.
- Revoke sessions following critical role changes.

### Session Store Rules
- Do not use MemoryStore in production.
- Use a compatible persistent MySQL session store.
- Confirm the installed store's actual schema
  before writing the SQL migration.
- Do not create a second incompatible sessions table.
- Handle database failures securely.
- Test expired-session cleanup.

### Indexes
- PRIMARY KEY (session_id)
- Additional indexes depend on the store schema.

### Security Notes
- Use a strong SESSION_SECRET from environment.
- Never commit real SESSION_SECRET values.
- Use HTTPS in production.
- Do not log session identifiers or cookies.
- Review session and cookie settings before deployment.

### Design Notes
- The session store may create its own table.
- Do not run CREATE TABLE during design.
- Database implementation is pending.
- Final integration with Auth API is pending.

---

## admin_audit_logs Table Design

Purpose:
Record important administrative actions for
accountability, security, and incident investigation.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT |
| actor_user_id | BIGINT UNSIGNED | NOT NULL, FOREIGN KEY |
| action | VARCHAR(80) | NOT NULL |
| target_type | VARCHAR(30) | NULL |
| target_id | BIGINT UNSIGNED | NULL |
| result | VARCHAR(20) | NOT NULL |
| metadata | JSON | NULL |
| request_id | VARCHAR(64) | NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Relationships
- admin_audit_logs.actor_user_id references users.id.
- One admin can perform multiple actions.
- Each log identifies the responsible admin.
- target_type and target_id identify the target.
- target_id is not a direct foreign key because
  targets may belong to different tables.

### Allowed Actions
Initial administrative actions:
- post.hide
- post.restore
- report.dismiss
- report.action_taken
- user.deactivate
- user.reactivate
- user.role_change

### Target Types
Allowed values:
- post
- report
- user

### Result Values
Allowed values:
- success
- failed

### Create Log Rules
- Admin authentication is required.
- Only the backend creates audit records.
- Never trust actor_user_id from the frontend.
- Verify admin permissions on the server.
- Validate the action and target type.
- Record the operation timestamp in UTC.
- Generate or propagate a request ID.

### Successful Operations
- Perform the protected database operation.
- Insert its corresponding audit log.
- Use the same database transaction.
- Commit only when both writes succeed.
- Roll back if either write fails.

### Failed Operations
- Failed attempts may be recorded separately.
- Do not record a failed operation inside
  a transaction that will be rolled back.
- Avoid logging confidential input values.
- Define security-event logging separately.

### Metadata Rules
- Metadata is optional.
- Store only necessary non-sensitive details.
- Use JSON for structured contextual information.
- Never store plaintext passwords.
- Never store password hashes.
- Never store session IDs or session cookies.
- Never store password reset tokens.
- Never store private credentials or secrets.
- Sanitize metadata before saving.

### Access Rules
- Regular users cannot access audit logs.
- Only authorized admins can view log records.
- Audit records are read-only through normal APIs.
- No public edit or delete endpoint is allowed.
- Audit access should be restricted and monitored.
- Support filtering and pagination.

### Immutability
- Do not update existing records through the app.
- Do not overwrite earlier events.
- Use append-only application behavior.
- Restrict database permissions where possible.
- Database administrators may still have
  privileged access; the table is not tamper-proof.

### Indexes
- PRIMARY KEY (id)
- Index admin_audit_logs(actor_user_id, created_at)
- Index admin_audit_logs(action, created_at)
- Index admin_audit_logs(target_type, target_id, created_at)
- Index admin_audit_logs(created_at)

### User Deletion Rules
- Preserve audit history according to policy.
- Do not cascade-delete audit records by default.
- Decide account deletion and anonymization rules
  before finalizing the foreign key.
- Review privacy and retention requirements.

### Security
- Use parameterized SQL queries.
- Require authorization for administrative actions.
- Protect log data from unauthorized access.
- Never expose logs through public APIs.
- Apply least-privilege database permissions.
- Avoid logging sensitive user information.

### Design Notes
- Initial scope focuses on Admin actions.
- Security login events may use a separate log.
- Audit retention duration must be finalized.
- Foreign key ON DELETE policy is pending.
- Database implementation is pending.

---

## Authentication and Admin Security Review

### Users
- users.id uses BIGINT UNSIGNED.
- Public registration always assigns role = 'user'.
- Role changes require authorized server operations.
- Inactive accounts cannot use protected APIs.
- session_version is used for global session revocation.
- Password hashes must never be returned in APIs.

### Password Reset
- Use cryptographically secure random tokens.
- Store token hashes, not original tokens.
- Reject expired and previously used tokens.
- Update password and consume token atomically.
- Invalidate outstanding reset tokens after success.
- Revoke existing sessions following password reset.

### Sessions
- Use a persistent server-side session store.
- Regenerate session ID after successful login.
- Validate authentication on protected requests.
- Compare sessionVersion with users.session_version.
- Check current account status and admin permissions.
- Destroy the session when logging out.
- Configure secure cookies and CSRF protection.
- Confirm session store schema before SQL migration.

### Admin Authorization
- Admin and User use the shared authentication system.
- The frontend may hide Admin navigation from users.
- Hiding an Admin URL does not provide security.
- Every Admin API must check server-side permissions.
- Never trust role values sent by the frontend.
- Normal registration cannot create Admin accounts.
- Role promotion requires a protected process.

### Admin Audit Logs
- Successful administrative changes are audited.
- Store the action and its corresponding audit log
  in the same transaction where appropriate.
- Audit records are read-only in normal APIs.
- Do not store passwords, tokens or session cookies.
- Restrict access to authorized personnel.
- Define a retention and account deletion policy.

### Pending Decisions Before SQL Migration
- Confirm MySQL version and supported constraints.
- Confirm session store library and its table schema.
- Confirm the final session expiration policy.
- Confirm foreign key ON DELETE behavior.
- Confirm user deletion and audit retention policies.
- Confirm database collation and UTC time handling.
- Confirm shared user ID and University relationship
  with Ball before creating database migrations.
