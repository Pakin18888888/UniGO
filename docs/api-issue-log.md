
# UniGO! API Final Issue and Decision Log

## 1. Document Information

- Project: UniGO!
- Owner: Kin
- Review Stage: STEP 02.03.06.04
- Related Document: docs/api-contract.md
- Database Design: docs/database-schema.md
- Database Review: docs/database-review.md
- Status: IN PROGRESS

## 2. Verified Documentation

- [x] API inventory: 63 endpoints
- [x] No missing Method/Path in inventory
- [x] No duplicate routes in inventory
- [x] API vs Database documentation reviewed
- [x] Cross-system security requirements documented

These checks verify documentation only.

## 3. Resolved Documentation Issues

### ISSUE-001: Anonymous Like Response

Status: RESOLVED IN DOCUMENTATION

- isLikedByMe is null for anonymous visitors.
- Authenticated visitors receive true or false.
- Runtime validation is still required.

### ISSUE-002: Admin-Hidden Post Modification

Status: RESOLVED IN DOCUMENTATION

- Updates to Admin-hidden posts are rejected.
- Media deletion from Admin-hidden posts is rejected.
- Runtime authorization testing is still required.

### ISSUE-003: Portfolio Restoration Privacy

Status: PROPOSED - AWAITING TEAM APPROVAL

- Restore the original portfolio record.
- Reset visibility to private on restoration.
- The owner must explicitly publish it again.

### ISSUE-004: Private Media Access

Status: PENDING IMPLEMENTATION DESIGN

- Private media must not use unrestricted public URLs.
- File access must respect ownership and visibility.
- Storage provider and delivery method are not selected.

## 4. Decisions Required Before Implementation

### DECISION-001: Deployment Topology

Priority: HIGH
Owner: Kin + Frontend Team
Status: PENDING

Proposed:
- Prefer same-origin frontend and API deployment.
- Use /api/v1 as the shared API base path.
- Confirm actual hosting and routing configuration.
- Configure credentialed CORS only if needed.

### DECISION-002: Session Storage

Priority: HIGH
Owner: Kin
Status: PENDING

Requirements:
- Use persistent server-side session storage.
- Check session expiration on the server.
- Check user account status and session_version.
- Confirm compatibility with the MySQL session design.
- Do not use Express MemoryStore in production.

### DECISION-003: CSRF Protection

Priority: HIGH
Owner: Kin
Status: PENDING

Requirements:
- Select token issuance and validation mechanism.
- Protect cookie-authenticated write operations.
- Include login/logout CSRF considerations.
- Confirm frontend token delivery.
- Add any new endpoint to the API inventory.

### DECISION-004: Database Compatibility

Priority: HIGH
Owner: Kin + Ball
Status: PENDING

Requirements:
- Confirm actual MySQL version.
- Verify all 15 table definitions.
- Verify CHECK and UNIQUE constraints.
- Verify foreign keys and ON DELETE rules.
- Confirm indexes and transaction support.
- Execute migrations only after review.

### DECISION-005: Media Storage

Priority: HIGH
Owner: Kin
Status: PENDING

Requirements:
- Select storage location/provider.
- Enforce upload validation.
- Protect private portfolio images.
- Protect hidden post media as required by policy.
- Implement safe replacement and deletion.

## 5. Additional Implementation Decisions

- Rate limiting thresholds: PENDING
- Session idle timeout: PENDING
- Session absolute timeout: PENDING
- Remember Me behavior: PENDING
- Final post and comment limits: PENDING
- Audit log retention: PENDING
- Portfolio retention policy: PENDING
- Pagination cursor implementation: PENDING

## 6. Implementation Readiness

Documentation:
- API Inventory: VERIFIED
- API Draft: COMPLETE
- Security Requirements: DOCUMENTED

Implementation:
- MySQL Database: NOT IMPLEMENTED
- Backend Server: NOT IMPLEMENTED
- Authentication Middleware: NOT IMPLEMENTED
- API Controllers: NOT IMPLEMENTED
- Frontend Integration: NOT STARTED
- Automated Tests: NOT STARTED
- Deployment: NOT STARTED

## 7. Approval Rules

- A proposed decision is not approved automatically.
- Record approval before changing status to APPROVED.
- Resolved documentation issues still require testing.
- Do not mark implementation tasks complete
  before actual implementation.
- Update the API Contract if a decision changes
  any request, response, route or security rule.

## 8. Next Actions

1. Confirm critical technical decisions.
2. Review unresolved issues with the team.
3. Update the API Contract where necessary.
4. Complete Final API Contract Review.
5. Commit reviewed documentation.
6. Begin Database and Backend Implementation.
