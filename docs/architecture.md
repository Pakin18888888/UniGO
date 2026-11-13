
# UniGO! — System Architecture

## 1. Technology Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: MySQL
- Database Driver: mysql2
- API: REST JSON
- Authentication: Server-side session with HttpOnly cookie

## 2. Backend Structure
- routes: API endpoints
- controllers: Request and response handling
- services: Business logic
- models: Database queries
- middlewares: Authentication and validation
- config: Database configuration
- utils: Shared utilities

## 3. API Convention
- Base path: /api/v1
- Request and response: JSON
- Use appropriate HTTP status codes
- Never return passwords or secrets
- Check authentication and authorization on the server

## 4. Team Responsibility
Kin:
- Authentication
- Profile and Onboarding
- Social Feed
- Portfolio
- Admin

Ball:
- University
- Exam
- Chat

Peak and Jan:
- Frontend integration

## 5. Database
- One shared MySQL database
- Shared user IDs across all modules
- Use foreign keys and indexes
- Use parameterized SQL queries
- Use migrations for schema changes
- Do not place real credentials in Git

## 6. Security
- Hash user passwords
- Use server-side session storage
- Use HttpOnly cookies
- Validate user input
- Enforce role-based permissions
- Protect state-changing requests against CSRF
- Keep secrets in .env
