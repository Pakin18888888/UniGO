
# UniGO! Database Decisions

## Status
- Current status: DRAFT
- Kin review: Proposed approach accepted
- Ball integration review: PENDING
- Team approval: PENDING
- SQL execution approval: PENDING

## 1. Foreign Key Policy
- Total proposed foreign keys: 18
- Use proposed RESTRICT / CASCADE policies.
- Review physical deletion behavior before approval.
- Prefer soft deletion where specified.
- Final team approval is required.

## 2. University Integration
- Current field: profiles.university_name
- This field is provisional.
- Coordinate university_id with Ball.
- Do not finalize integration before review.

## 3. Session Storage
- Library: express-session
- MySQL Store: express-mysql-session 3.0.3
- Storage table: sessions
- Session management: Server-side
- Authentication cookie: HttpOnly
- createDatabaseTable: false
- Migration: 014_create_sessions.sql
- Schema structure reviewed.
- Runtime integration testing: PENDING

## 4. Reports and Audit Logs
- Preserve moderation and admin activity history.
- Define retention and account deletion policies.
- Team approval: PENDING

## 5. Media Storage
- Store media files outside MySQL.
- Store file references in the database.
- Handle physical file deletion in the backend.
- Define safe cleanup and authorization rules.

## 6. Database Standards
- MySQL: 8.4.13
- Engine: InnoDB
- Charset: utf8mb4
- Collation: utf8mb4_0900_ai_ci
- BIGINT IDs are serialized as strings in JSON.

## 7. Migration Status
- Migration files: 15
- Foreign keys documented: 18
- Column names checked: PASS
- Data type consistency checked: PASS
- Dependency order checked: PASS
- MySQL execution test: NOT STARTED

## 8. Required Before Execution
- [ ] Ball reviews university integration.
- [ ] Team approves foreign key deletion policies.
- [ ] Team approves report and audit retention.
- [ ] Confirm media cleanup policy.
- [ ] Review database constraints and indexes.
- [ ] Run migrations in an isolated test database.
- [ ] Verify session store runtime behavior.
- [ ] Approve development database setup.
