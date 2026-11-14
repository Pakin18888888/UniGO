
# UniGO! API Contract

## 1. API Overview

- Project: UniGO!
- API Style: REST
- Data Format: JSON
- Base Path: /api/v1
- Authentication: Server-side session
- Cookie: HttpOnly
- Backend Owner: Kin
- Database: MySQL
- Status: DRAFT

## 2. General Rules

- Request and response bodies use JSON unless specified.
- Protected endpoints require authentication.
- Admin endpoints require server-side authorization.
- Never trust userId or role from the frontend.
- Never return passwords, password hashes or secrets.
- Serialize BIGINT IDs as strings.
- Return timestamps in ISO 8601 UTC format.
- Validate all user input.
- Use appropriate HTTP status codes.
- Protect state-changing requests against CSRF.
- The final CSRF mechanism is pending implementation.

## 3. Standard Response Format

### 3.1 Success Response

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {}
}
```

### 3.2 Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_EMAIL",
      "detail": "Email format is invalid."
    }
  ]
}
```

### 3.3 HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

Validation errors may include field information.
Login credential failures must use a generic message.

---

## 4. Authentication API

### 4.1 Register

- Method: POST
- Path: /api/v1/auth/register
- Authentication Required: No
- Owner: Kin

#### Request Body

```json
{
  "firstName": "Example",
  "lastName": "Student",
  "username": "student01",
  "email": "student@example.com",
  "password": "ExamplePassword123!",
  "confirmPassword": "ExamplePassword123!",
  "acceptTerms": true
}
```

#### Validation

- firstName is required.
- lastName is required.
- username is required and must be unique.
- email must be valid and unique.
- password must satisfy the agreed password policy.
- confirmPassword must match password.
- acceptTerms must be true.
- Do not accept role from the frontend.
- Public registration always assigns role = user.
- Hash the password before saving.
- Create users and profiles in one transaction.
- Terms acceptance recording policy is pending.

#### Success Response: 201 Created

```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": "1",
      "username": "student01",
      "email": "student@example.com",
      "role": "user",
      "isActive": true
    },
    "profile": {
      "userId": "1",
      "firstName": "Example",
      "lastName": "Student",
      "educationType": null,
      "onboardingCompletedAt": null
    }
  }
}
```

#### Errors

- 400: Invalid request
- 409: Username or email already exists
- 422: Validation failed
- 429: Too many requests
- 500: Internal server error

#### Notes

- Registration does not automatically grant admin access.
- Whether registration automatically logs in the user
  must be finalized before implementation.
- Successful registration leads to onboarding.

---

### 4.2 Login

- Method: POST
- Path: /api/v1/auth/login
- Authentication Required: No
- Owner: Kin

#### Request Body

```json
{
  "login": "student@example.com",
  "password": "ExamplePassword123!",
  "rememberMe": false
}
```

#### Validation

- login is required.
- password is required.
- login accepts username or email.
- rememberMe is an optional boolean.
- Reject incorrect credentials.
- Reject inactive accounts.
- Use a generic message for invalid credentials.
- Apply rate limiting.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "1",
      "username": "student01",
      "email": "student@example.com",
      "role": "user",
      "isActive": true
    }
  }
}
```

#### Session Behavior

- Regenerate session ID after successful login.
- Create a server-side session.
- Return the session cookie using Set-Cookie.
- Configure HttpOnly and other cookie protections.
- Store only necessary session information.
- Apply the agreed Remember Me policy.

#### Errors

- 400: Missing fields
- 401: Invalid credentials
- 429: Too many attempts
- 500: Internal server error

---

### 4.3 Logout

- Method: POST
- Path: /api/v1/auth/logout
- Authentication Required: Yes
- Owner: Kin

#### Request

- No JSON body required.
- Browser sends the session cookie.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Logout successful.",
  "data": null
}
```

#### Rules

- Destroy the server-side session.
- Clear the matching session cookie.
- Protect the endpoint against CSRF.
- Repeated logout behavior must be consistent.

#### Errors

- 401: Unauthenticated
- 500: Internal server error

---

### 4.4 Get Current Session User

- Method: GET
- Path: /api/v1/auth/me
- Authentication Required: Yes
- Owner: Kin

#### Request

- No JSON body required.
- Browser sends the session cookie.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Authenticated user retrieved successfully.",
  "data": {
    "user": {
      "id": "1",
      "username": "student01",
      "email": "student@example.com",
      "role": "user",
      "isActive": true
    },
    "profile": {
      "userId": "1",
      "firstName": "Example",
      "lastName": "Student",
      "displayName": null,
      "avatarUrl": null,
      "educationType": null,
      "onboardingCompletedAt": null
    }
  }
}
```

#### Rules

- Validate the session on the server.
- Verify the user is still active.
- Check session version if enabled.
- Retrieve current role from trusted server data.
- Do not return password_hash.
- Return only fields authorized for this user.

#### Errors

- 401: Unauthenticated
- 500: Internal server error

---

### 4.5 Forgot Password

- Method: POST
- Path: /api/v1/auth/forgot-password
- Authentication Required: No
- Owner: Kin

#### Request Body

```json
{
  "email": "student@example.com"
}
```

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "If the email is registered, a password reset link will be sent.",
  "data": null
}
```

#### Rules

- Validate email format.
- Apply rate limiting.
- Do not reveal if the account exists.
- Generate a secure random token for valid accounts.
- Store only the token hash.
- Send a reset link through an email provider.
- Do not return the token in the API response.
- Use the agreed token expiration policy.

#### Errors

- 400: Invalid request
- 429: Too many requests
- 500: Internal server error

#### Notes

- Email provider configuration is pending.
- Missing and invalid email formats may be validated,
  but account existence must remain private.

---

### 4.6 Reset Password

- Method: POST
- Path: /api/v1/auth/reset-password
- Authentication Required: No
- Owner: Kin

#### Request Body

```json
{
  "token": "reset-token-from-email",
  "newPassword": "AnotherStrongPassword123!",
  "confirmPassword": "AnotherStrongPassword123!"
}
```

#### Validation

- token is required.
- newPassword is required.
- confirmPassword must match newPassword.
- The token must be valid and not expired.
- The token must not have been used.
- The new password must satisfy password policy.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Password has been reset successfully.",
  "data": null
}
```

#### Rules

- Hash the supplied reset token for lookup.
- Hash the new password securely.
- Use a transaction for the reset operation.
- Mark the token as used.
- Invalidate other outstanding reset tokens.
- Revoke existing sessions according to policy.
- Require login again after password reset.

#### Errors

- 400: Invalid request or reset token
- 422: Invalid password
- 429: Too many attempts
- 500: Internal server error

---

## 5. Pending API Sections

- Profile API
- Onboarding API
- Social Feed API
- Comment API
- Post Like API
- Follow API
- Hashtag API
- Portfolio API
- Report API
- Admin API

## 6. Team Integration

### Kin
- Authentication API
- Profile and Onboarding API
- Social Feed API
- Portfolio API
- Admin API

### Peak
- Login and Register frontend
- Profile frontend
- Connect Auth and Profile APIs

### Jan
- Feed and Portfolio frontend
- Connect Feed and Portfolio APIs

### Ball
- University API
- Exam API
- Chat API
- Coordinate shared user IDs

## 7. Pending Decisions

- Password complexity policy
- Automatic login after registration
- Terms acceptance record and policy version
- Email verification requirement
- Final validation error codes
- CSRF protection mechanism
- Cross-origin cookie configuration
- Rate limiting thresholds
- Production API domain
- Final team approval

---

## 8. Profile and Onboarding API

- Owner: Kin
- Frontend Integration: Peak
- Base Path: /api/v1/profiles
- Status: DRAFT

### 8.1 Get My Profile

- Method: GET
- Path: /api/v1/profiles/me
- Authentication Required: Yes

#### Request
- No JSON body.
- Browser sends the session cookie.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "profile": {
      "userId": "1",
      "username": "student01",
      "firstName": "Example",
      "lastName": "Student",
      "displayName": "Example Student",
      "avatarUrl": null,
      "bio": "Interested in game development.",
      "statusText": "Studying",
      "educationType": "university",
      "age": 21,
      "schoolName": null,
      "gradeLevel": null,
      "universityName": "Example University",
      "universityYear": 3,
      "contactVisibility": "private",
      "onboardingCompletedAt": "2026-11-14T03:00:00Z"
    }
  }
}
```

#### Rules
- Retrieve userId from the session.
- Return only the authenticated user's profile.
- Never expose password hashes.
- Include private profile fields only for the owner.
- Return 401 if the user is not authenticated.

---

### 8.2 Update My Profile

- Method: PATCH
- Path: /api/v1/profiles/me
- Authentication Required: Yes

#### Request Body

```json
{
  "firstName": "Example",
  "lastName": "Student",
  "displayName": "Example Dev",
  "bio": "I enjoy building games and websites.",
  "statusText": "Open to collaboration",
  "contactVisibility": "private"
}
```

#### Editable Fields
- firstName
- lastName
- displayName
- bio
- statusText
- contactVisibility

#### Validation Rules
- Update only fields explicitly supplied.
- firstName and lastName cannot be empty.
- Proposed bio limit: 500 characters.
- statusText maximum: 100 characters.
- contactVisibility accepts:
  - private
  - followers
  - public
- Reject unknown or protected fields.
- Do not allow changes to userId or role.
- Email and password require separate account APIs.
- Education changes use the onboarding endpoint.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "profile": {
      "userId": "1",
      "displayName": "Example Dev",
      "bio": "I enjoy building games and websites.",
      "statusText": "Open to collaboration",
      "contactVisibility": "private"
    }
  }
}
```

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 422: Validation failed
- 500: Internal server error

---

### 8.3 Complete or Update Onboarding

- Method: PUT
- Path: /api/v1/profiles/me/onboarding
- Authentication Required: Yes

#### School Student Request

```json
{
  "educationType": "school",
  "age": 18,
  "schoolName": "Example School",
  "gradeLevel": "ม.6"
}
```

#### University Student Request

```json
{
  "educationType": "university",
  "age": 21,
  "universityName": "Example University",
  "universityYear": 3
}
```

#### Validation Rules
- educationType is required.
- Allowed values: school, university.
- age is required and must be in an agreed range.
- For school:
  - schoolName is required.
  - gradeLevel is required.
  - University fields must not be submitted.
- For university:
  - universityName is required.
  - universityYear is required.
  - School fields must not be submitted.
- Validate all values on the server.
- Clear fields belonging to the previous
  education type when switching types.
- Reject protected or unknown fields.
- The user must be authenticated.
- Use userId from the authenticated session.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Onboarding completed successfully.",
  "data": {
    "profile": {
      "userId": "1",
      "educationType": "university",
      "age": 21,
      "universityName": "Example University",
      "universityYear": 3,
      "onboardingCompletedAt": "2026-11-14T03:00:00Z"
    }
  }
}
```

#### Rules
- Create the basic profile during registration.
- Update the existing profile during onboarding.
- Do not create duplicate profiles.
- Set onboardingCompletedAt on first completion.
- Keep the initial completion timestamp on
  later education updates.
- All education fields must be validated together.
- universityName is provisional until Ball
  confirms the University database contract.

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 422: Validation failed
- 500: Internal server error

---

### 8.4 Get Public User Profile

- Method: GET
- Path: /api/v1/profiles/:userId
- Authentication Required: No (initial proposal)

#### Path Parameter
- userId: valid BIGINT UNSIGNED identifier.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Public profile retrieved successfully.",
  "data": {
    "profile": {
      "userId": "1",
      "username": "student01",
      "displayName": "Example Dev",
      "avatarUrl": null,
      "bio": "I enjoy building games.",
      "statusText": "Studying",
      "educationType": "university"
    }
  }
}
```

#### Privacy Rules
- Return only explicitly public fields.
- Do not return email or password information.
- Do not return age by default.
- Do not expose contact details without permission.
- Do not expose private onboarding details.
- Do not expose inactive accounts publicly.
- School and university names require a final
  field-visibility policy before public exposure.

#### Errors
- 400: Invalid userId
- 404: Profile not found or unavailable
- 500: Internal server error

---

### 8.5 Upload Profile Avatar

- Method: POST
- Path: /api/v1/profiles/me/avatar
- Authentication Required: Yes
- Content-Type: multipart/form-data

#### Form Data
- Field name: avatar
- Field type: File

#### Proposed Upload Rules
- Allowed types: JPEG, PNG, WebP.
- Proposed maximum file size: 5 MB.
- Validate actual file content.
- Reject unsupported formats.
- Reject malformed images.
- Generate a safe unique storage key.
- Never trust the original filename.
- Restrict access to the upload API.
- Do not allow executable uploads.
- Store only the image reference in profiles.
- Define safe replacement and cleanup behavior.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Avatar uploaded successfully.",
  "data": {
    "avatarUrl": "/uploads/avatars/example.webp"
  }
}
```

#### Errors
- 400: Missing or invalid file
- 401: Unauthenticated
- 413: File too large
- 415: Unsupported media type
- 500: Internal server error

---

### 8.6 Delete Profile Avatar

- Method: DELETE
- Path: /api/v1/profiles/me/avatar
- Authentication Required: Yes

#### Request
- No JSON body required.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Avatar removed successfully.",
  "data": {
    "avatarUrl": null
  }
}
```

#### Rules
- Verify the authenticated user.
- Remove the avatar reference from the profile.
- Repeated delete requests should be safe.
- Clean up stored files through a safe process.
- Never delete files belonging to another user.
- Protect state-changing requests against CSRF.

#### Errors
- 401: Unauthenticated
- 500: Internal server error

---

### 8.7 Profile Security Rules

- Every private profile API requires authentication.
- The backend determines the current user.
- Do not accept role or userId as proof of identity.
- Users cannot edit another user's profile.
- Validate all fields before database updates.
- Use parameterized SQL queries.
- Protect PATCH, PUT, POST and DELETE against CSRF.
- Apply upload limits and validate image files.
- Expose only approved public profile information.
- Treat age and education details as personal data.
- Contact visibility needs defined contact fields
  before the feature can be fully implemented.

### 8.8 Database Dependencies

- users
- profiles

Shared database decisions:
- profiles.user_id references users.id.
- Use BIGINT UNSIGNED for user IDs.
- Prevent duplicate profiles.
- Coordinate the university relationship with Ball.
- Do not finalize universityId until team review.

### 8.9 Frontend Integration Notes

Peak should:
- Call GET /profiles/me for the edit page.
- Call PATCH /profiles/me for profile changes.
- Call PUT /profiles/me/onboarding after registration.
- Call GET /profiles/:userId for public profiles.
- Use FormData when uploading avatars.
- Handle 401 by directing users to login.
- Display validation errors clearly.
- Send authenticated cookies with API requests.
- Never use client-side role checks as security.

### 8.10 Pending Decisions

- Public profile visibility policy
- Contact field definitions
- Final age validation policy
- School grade level options
- University ID integration with Ball
- Avatar storage provider
- Avatar file size limit
- CSRF protection implementation
- Final API review

---

## 9. Social Feed - Posts API

- Owner: Kin
- Frontend Integration: Jan
- Base Path: /api/v1/posts
- Status: DRAFT

### 9.1 Get Feed Posts

- Method: GET
- Path: /api/v1/posts
- Authentication Required: No (initial proposal)

#### Query Parameters
- limit: optional, default 20, maximum 50
- cursor: optional pagination cursor
- hashtag: optional normalized hashtag filter

Example:
GET /api/v1/posts?limit=20

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Posts retrieved successfully.",
  "data": {
    "posts": [
      {
        "id": "100",
        "content": "My first UniGO post! #Portfolio",
        "author": {
          "id": "1",
          "username": "student01",
          "displayName": "Example Student",
          "avatarUrl": null
        },
        "media": [],
        "hashtags": ["portfolio"],
        "likeCount": 10,
        "commentCount": 3,
        "isLikedByMe": null,
        "createdAt": "2026-11-14T03:00:00Z",
        "updatedAt": "2026-11-14T03:00:00Z"
      }
    ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

#### Feed Rules
- Return only visible posts.
- Exclude soft-deleted posts.
- Exclude posts belonging to inactive accounts.
- Sort by created_at DESC, id DESC.
- Use stable cursor-based pagination.
- Generate nextCursor on the server.
- Treat cursor as opaque to the frontend.
- Validate limit and cursor.
- Use parameterized SQL queries.
- Avoid N+1 database queries.
- isLikedByMe is null for unauthenticated visitors.
- For authenticated visitors, return true or false.

---

### 9.2 Get Post Details

- Method: GET
- Path: /api/v1/posts/:postId
- Authentication Required: No (initial proposal)

#### Path Parameter
- postId: valid BIGINT UNSIGNED identifier.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Post retrieved successfully.",
  "data": {
    "post": {
      "id": "100",
      "content": "My first UniGO post! #Portfolio",
      "author": {
        "id": "1",
        "username": "student01",
        "displayName": "Example Student",
        "avatarUrl": null
      },
      "media": [],
      "hashtags": ["portfolio"],
      "likeCount": 10,
      "commentCount": 3,
      "isLikedByMe": false,
      "createdAt": "2026-11-14T03:00:00Z",
      "updatedAt": "2026-11-14T03:00:00Z"
    }
  }
}
```

#### Rules
- Return only visible, non-deleted posts.
- Exclude posts belonging to inactive accounts.
- Check whether postId is valid.
- Return 404 for unavailable public posts.
- Never expose internal moderation notes.
- Apply the same post representation as the Feed.

#### Errors
- 400: Invalid postId
- 404: Post not found or unavailable
- 500: Internal server error

---

### 9.3 Create Post

- Method: POST
- Path: /api/v1/posts
- Authentication Required: Yes
- Content-Type: multipart/form-data

#### Form Data
- content: optional text
- images: optional image files, repeated field

Example content:
My first UniGO post! #Portfolio #TCAS

#### Validation
- At least text or one image is required.
- Content must not be empty if no images exist.
- Proposed text limit: 5000 characters.
- Proposed maximum images: 4 per post.
- Proposed maximum file size: 5 MB per image.
- Allow JPEG, PNG and WebP.
- Validate actual file contents.
- Reject invalid or unsupported files.
- Validate the current user session.
- Require a completed onboarding profile
  if the final access policy requires it.
- Never accept userId or role as ownership proof.

#### Create Rules
- Read userId from the session.
- Validate the content and images.
- Extract hashtags from the content.
- Normalize hashtag names.
- Prevent duplicate hashtags.
- Generate safe unique media file keys.
- Store posts and relational records
  using a database transaction.
- Handle failed media storage safely.
- Clean up orphaned files after failures.
- Do not trust uploaded file names.

#### Success Response: 201 Created

```json
{
  "success": true,
  "message": "Post created successfully.",
  "data": {
    "post": {
      "id": "101",
      "content": "My first UniGO post! #Portfolio #TCAS",
      "author": {
        "id": "1",
        "username": "student01",
        "displayName": "Example Student",
        "avatarUrl": null
      },
      "media": [],
      "hashtags": ["portfolio", "tcas"],
      "likeCount": 0,
      "commentCount": 0,
      "isLikedByMe": false,
      "createdAt": "2026-11-14T03:15:00Z",
      "updatedAt": "2026-11-14T03:15:00Z"
    }
  }
}
```

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 413: File too large
- 415: Unsupported media type
- 422: Validation failed
- 429: Too many requests
- 500: Internal server error

---

### 9.4 Update Post

- Method: PATCH
- Path: /api/v1/posts/:postId
- Authentication Required: Yes
- Content-Type: application/json

#### Request Body

```json
{
  "content": "Updated portfolio post! #Portfolio"
}
```

#### Validation
- The post must exist.
- The post must not be soft-deleted.
- The authenticated user must own the post.
- Only allowed fields can be changed.
- Content must follow the length limit.
- Do not leave the post empty when no media exists.
- Media management uses separate endpoints.
- Admin moderation uses protected Admin APIs.

#### Update Rules
- Verify ownership on the server.
- Update only permitted fields.
- Re-extract hashtags after content changes.
- Add and remove hashtag relationships.
- Use a transaction for related database writes.
- Preserve created_at.
- Update updated_at.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Post updated successfully.",
  "data": {
    "post": {
      "id": "101",
      "content": "Updated portfolio post! #Portfolio",
      "hashtags": ["portfolio"],
      "updatedAt": "2026-11-14T03:30:00Z"
    }
  }
}
```

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 403: Not the post owner
- 404: Post not found
- 422: Validation failed
- 500: Internal server error

---

### 9.5 Delete Post

- Method: DELETE
- Path: /api/v1/posts/:postId
- Authentication Required: Yes

#### Request
- No JSON body required.
- postId is supplied in the URL.

#### Delete Rules
- Verify authenticated ownership.
- Do not permit deletion of another user's post.
- Use soft delete.
- Set posts.deleted_at to the current UTC time.
- Do not physically delete the post.
- Exclude deleted posts from public Feed queries.
- Exclude deleted posts from hashtag searches.
- Do not accept new comments or likes on deleted posts.
- Retain dependent records according to policy.
- Repeated deletion by the owner may be a no-op.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Post deleted successfully.",
  "data": null
}
```

#### Errors
- 400: Invalid postId
- 401: Unauthenticated
- 403: Not the post owner
- 404: Post not found
- 500: Internal server error

---

### 9.6 Shared Post Rules

- All post IDs are serialized as strings.
- All timestamps use ISO 8601 UTC.
- Never trust userId from client input.
- Protect POST, PATCH and DELETE against CSRF.
- Check account status before modifications.
- Verify ownership before update or deletion.
- Hidden and soft-deleted posts are not public.
- Use parameterized SQL queries.
- Return a consistent response shape.
- Media storage must use a controlled process.
- Do not expose private user data.

### 9.7 Database Dependencies

- users
- profiles
- posts
- post_media
- post_likes
- comments
- hashtags
- post_hashtags

### 9.8 Frontend Integration Notes

Jan should:
- Use GET /posts to render the Feed.
- Use GET /posts/:postId for post details.
- Use FormData for creating posts.
- Use PATCH /posts/:postId for editing text.
- Use DELETE /posts/:postId for soft deletion.
- Render API-provided author and media data.
- Handle pagination using nextCursor.
- Use hasMore to control loading more posts.
- Display error messages appropriately.
- Send authenticated cookies for write operations.
- Hide edit and delete controls for other users.
- Never rely on hidden controls for security.

### 9.9 Pending Decisions

- Maximum post text length
- Maximum images and upload size
- Media storage provider
- Final public Feed visibility policy
- Onboarding requirement for posting
- Cursor encoding and validation
- Whether posts can be shared by URL only
- Media editing endpoints
- Final pagination and indexing strategy
- Final API approval

---

## 10. Social Feed - Post Media API

- Owner: Kin
- Frontend Integration: Jan
- Base Path: /api/v1/posts
- Status: DRAFT

### 10.1 Add Post Media

- Method: POST
- Path: /api/v1/posts/:postId/media
- Authentication Required: Yes
- Content-Type: multipart/form-data

#### Path Parameters
- postId: valid BIGINT UNSIGNED identifier.

#### Form Data
- image: required image file.

#### Validation Rules
- The user must be authenticated.
- The post must exist.
- The post must not be soft-deleted.
- The authenticated user must own the post.
- Adding media to hidden posts is not allowed
  in the initial version.
- Maximum images per post: proposed 4.
- Maximum file size: proposed 5 MB.
- Allowed types: JPEG, PNG, WebP.
- Validate actual file content and MIME type.
- Reject malformed and unsupported files.
- Never trust the original filename.
- Prevent path traversal and unsafe file paths.
- Apply file upload rate and size limits.

#### Upload Rules
- Read userId from the authenticated session.
- Verify the post belongs to the current user.
- Verify the maximum image count.
- Generate a safe unique file key.
- Store the file using controlled storage.
- Create a post_media record.
- Assign the next available sort_order.
- Return a usable media URL.
- Handle concurrent uploads without exceeding
  the maximum image count.
- Handle failed uploads and database writes.
- Clean up orphaned uploaded files safely.
- Do not expose internal storage credentials.

#### Success Response: 201 Created

```json
{
  "success": true,
  "message": "Post image uploaded successfully.",
  "data": {
    "media": {
      "id": "501",
      "postId": "100",
      "url": "/uploads/posts/example.webp",
      "mimeType": "image/webp",
      "sortOrder": 1,
      "createdAt": "2026-11-14T03:30:00Z"
    }
  }
}
```

#### Errors
- 400: Invalid request or missing image
- 401: Unauthenticated
- 403: Not the post owner
- 404: Post not found
- 409: Image limit or post state conflict
- 413: File too large
- 415: Unsupported media type
- 422: Invalid image
- 429: Too many requests
- 500: Internal server error

---

### 10.2 Delete Post Media

- Method: DELETE
- Path: /api/v1/posts/:postId/media/:mediaId
- Authentication Required: Yes

#### Path Parameters
- postId: valid BIGINT UNSIGNED identifier.
- mediaId: valid BIGINT UNSIGNED identifier.

#### Request
- No JSON body required.
- Browser sends the session cookie.

#### Delete Rules
- The user must be authenticated.
- Verify that the post exists.
- Verify ownership of the post.
- Verify that mediaId belongs to postId.
- Do not delete another user's media.
- Reject modifications to soft-deleted posts.
- Do not allow the post to become empty.
- If content is empty, at least one image
  must remain after deletion.
- Remove the media reference from post_media.
- Update ordering if required.
- Use a database transaction for related
  database changes.
- Never trust file paths supplied by the client.
- Schedule or perform safe storage cleanup.
- Avoid deleting files used by other records.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Post image deleted successfully.",
  "data": null
}
```

#### Errors
- 400: Invalid postId or mediaId
- 401: Unauthenticated
- 403: Not the post owner
- 404: Post or media not found
- 409: Deletion would leave an empty post
- 500: Internal server error

---

### 10.3 Post Media Database Rules

Database tables:
- posts
- post_media
- users

Relationships:
- post_media.post_id references posts.id.
- One post can contain multiple media records.
- One media record belongs to one post.

Stored fields:
- id
- post_id
- file_key
- mime_type
- sort_order
- created_at

#### Database Rules
- Use parameterized SQL queries.
- Validate post ownership before modification.
- Never accept userId from the frontend.
- Limit image count per post.
- Preserve correct media ordering.
- Protect related database writes with
  transactions where appropriate.
- Keep internal file_key values private.
- Return a usable URL rather than raw file_key.

### 10.4 File Storage Rules

- File storage provider is pending selection.
- Store image files outside MySQL.
- Use generated unique filenames or keys.
- Restrict uploaded file types.
- Validate file signatures and file contents.
- Store files in a non-executable location.
- Re-encode images when appropriate.
- Apply image size limits.
- Do not trust user-supplied paths.
- Protect private files from public access.
- Public post images may use authorized
  public delivery URLs.

#### Consistency Rules
- MySQL transactions do not automatically
  roll back external file storage changes.
- Clean up uploaded files if database writes fail.
- Handle failed file deletion safely.
- Use a retry or cleanup process if necessary.
- Avoid exposing orphaned files publicly.

### 10.5 Integration with Posts API

- POST /posts can create a post with images.
- POST /posts/:postId/media adds an image later.
- DELETE /posts/:postId/media/:mediaId removes an image.
- PATCH /posts/:postId updates post text.
- All endpoints must use one shared media format.
- GET /posts returns media as an array.
- GET /posts/:postId returns media as an array.
- Deleted media must not appear in responses.

### 10.6 Shared Media Response Format

```json
{
  "id": "501",
  "postId": "100",
  "url": "/uploads/posts/example.webp",
  "mimeType": "image/webp",
  "sortOrder": 1,
  "createdAt": "2026-11-14T03:30:00Z"
}
```

All post media objects should use the same
field names across Feed and Post Details APIs.

### 10.7 Frontend Integration Notes

Jan should:
- Use FormData for image uploads.
- Use the field name "image" for adding one image.
- Use "images" for repeated files in POST /posts.
- Never send userId as proof of ownership.
- Use media IDs returned by the API.
- Render media in sortOrder order.
- Update the UI after successful upload.
- Update the UI after successful deletion.
- Show useful upload validation errors.
- Handle image count and size limits.
- Send session cookies for authenticated requests.
- Include the agreed CSRF protection on writes.

### 10.8 Pending Decisions

- Final image count limit
- Final maximum upload file size
- File storage provider
- File URL generation policy
- Image re-encoding policy
- Media ordering API
- Concurrent upload handling
- Orphan file cleanup process
- CSRF protection implementation
- Final API approval

---

## 11. Social Feed - Comments and Likes API

- Owner: Kin
- Frontend Integration: Jan
- Status: DRAFT

### 11.1 Get Post Comments

- Method: GET
- Path: /api/v1/posts/:postId/comments
- Authentication Required: No (initial proposal)

#### Path Parameters
- postId: valid BIGINT UNSIGNED identifier.

#### Query Parameters
- limit: optional, default 20, maximum 50
- cursor: optional pagination cursor

Example:
GET /api/v1/posts/100/comments?limit=20

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Comments retrieved successfully.",
  "data": {
    "comments": [
      {
        "id": "501",
        "postId": "100",
        "content": "Great portfolio!",
        "author": {
          "id": "2",
          "username": "student02",
          "displayName": "Example Student",
          "avatarUrl": null
        },
        "createdAt": "2026-11-14T03:00:00Z",
        "updatedAt": "2026-11-14T03:00:00Z"
      }
    ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

#### Rules
- Return comments only from available public posts.
- Exclude hidden and soft-deleted comments.
- Exclude posts that are hidden or soft-deleted.
- Exclude content from inactive accounts.
- Sort by created_at ASC, id ASC.
- Support stable cursor pagination.
- Treat the cursor as opaque.
- Return author public information only.
- Never expose private account information.
- Use parameterized SQL queries.

#### Errors
- 400: Invalid postId or query parameters
- 404: Post not found or unavailable
- 500: Internal server error

---

### 11.2 Create Comment

- Method: POST
- Path: /api/v1/posts/:postId/comments
- Authentication Required: Yes
- Content-Type: application/json

#### Request Body

```json
{
  "content": "Great work! I like this project."
}
```

#### Validation
- The user must be authenticated.
- The target post must exist.
- The target post must be visible.
- The target post must not be soft-deleted.
- The account must be active.
- Content is required.
- Reject empty or whitespace-only comments.
- Proposed maximum: 2000 characters.
- Do not accept userId from the frontend.
- Apply rate limiting to prevent spam.

#### Success Response: 201 Created

```json
{
  "success": true,
  "message": "Comment created successfully.",
  "data": {
    "comment": {
      "id": "502",
      "postId": "100",
      "content": "Great work! I like this project.",
      "author": {
        "id": "1",
        "username": "student01",
        "displayName": "Example Student",
        "avatarUrl": null
      },
      "createdAt": "2026-11-14T03:10:00Z",
      "updatedAt": "2026-11-14T03:10:00Z"
    }
  }
}
```

#### Rules
- Use userId from the authenticated session.
- Validate all request fields.
- Create the comment in MySQL.
- Return the created comment.
- Protect the request against CSRF.
- Never return password or private user data.

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 404: Post unavailable
- 422: Validation failed
- 429: Too many requests
- 500: Internal server error

---

### 11.3 Update Comment

- Method: PATCH
- Path: /api/v1/comments/:commentId
- Authentication Required: Yes
- Content-Type: application/json

#### Request Body

```json
{
  "content": "Updated comment content."
}
```

#### Validation
- The user must be authenticated.
- The comment must exist.
- The authenticated user must own the comment.
- The comment must not be soft-deleted.
- The parent post must allow modifications.
- Reject unknown fields.
- Content cannot be empty.
- Proposed maximum: 2000 characters.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Comment updated successfully.",
  "data": {
    "comment": {
      "id": "502",
      "postId": "100",
      "content": "Updated comment content.",
      "updatedAt": "2026-11-14T03:20:00Z"
    }
  }
}
```

#### Rules
- Check ownership on the server.
- Update content and updated_at.
- Preserve created_at.
- Never accept userId from the frontend.
- Do not allow regular users to change
  moderation_status.
- Protect the request against CSRF.

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 403: Not the comment owner
- 404: Comment not found
- 409: Comment or parent post state conflict
- 422: Validation failed
- 500: Internal server error

---

### 11.4 Delete Comment

- Method: DELETE
- Path: /api/v1/comments/:commentId
- Authentication Required: Yes

#### Request
- No JSON body required.

#### Delete Rules
- Authentication is required.
- Verify ownership of the comment.
- Use soft delete.
- Set comments.deleted_at to the current UTC time.
- Do not physically delete the record.
- Exclude deleted comments from public responses.
- Repeated deletion by the owner may be a no-op.
- Admin moderation uses separate protected APIs.
- Protect the request against CSRF.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Comment deleted successfully.",
  "data": null
}
```

#### Errors
- 400: Invalid commentId
- 401: Unauthenticated
- 403: Not the comment owner
- 404: Comment not found
- 500: Internal server error

---

### 11.5 Like Post

- Method: PUT
- Path: /api/v1/posts/:postId/like
- Authentication Required: Yes

#### Request
- No JSON body required.
- Browser sends the session cookie.

#### Validation
- The user must be authenticated.
- The target post must exist and be visible.
- The target post must not be soft-deleted.
- The target post owner must be active.
- Use userId from the authenticated session.
- Do not trust userId supplied by the frontend.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Post liked successfully.",
  "data": {
    "postId": "100",
    "isLikedByMe": true,
    "likeCount": 11
  }
}
```

#### Database Rules
- Use post_likes table.
- Composite PRIMARY KEY (post_id, user_id).
- Insert a like only if the relationship
  does not already exist.
- Repeated requests must not create duplicates.
- Concurrent requests must respect the unique key.
- Count likes from stored relationships.
- Use parameterized SQL queries.
- Protect the request against CSRF.

#### Errors
- 400: Invalid postId
- 401: Unauthenticated
- 404: Post unavailable
- 429: Too many requests
- 500: Internal server error

---

### 11.6 Unlike Post

- Method: DELETE
- Path: /api/v1/posts/:postId/like
- Authentication Required: Yes

#### Request
- No JSON body required.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Post unliked successfully.",
  "data": {
    "postId": "100",
    "isLikedByMe": false,
    "likeCount": 10
  }
}
```

#### Rules
- Authentication is required.
- Use userId from the session.
- Remove only the current user's like.
- Do not remove other users' likes.
- Repeated unlike requests may be no-ops.
- Do not allow interaction with unavailable posts.
- Count the remaining likes.
- Protect the request against CSRF.

#### Errors
- 400: Invalid postId
- 401: Unauthenticated
- 404: Post unavailable
- 500: Internal server error

---

### 11.7 Shared Comments and Likes Rules

- Use BIGINT IDs serialized as strings.
- Use ISO 8601 UTC timestamps.
- Never trust userId from the frontend.
- Validate authentication and authorization.
- Verify the post is available.
- Use parameterized SQL queries.
- Apply rate limiting to write operations.
- Protect state-changing requests against CSRF.
- Keep response field names consistent.
- Hide moderated and deleted content.
- Do not expose sensitive user data.

### 11.8 Database Dependencies

Tables:
- users
- profiles
- posts
- comments
- post_likes

Relationships:
- comments.post_id references posts.id.
- comments.user_id references users.id.
- post_likes.post_id references posts.id.
- post_likes.user_id references users.id.

Database constraints:
- comments.id is PRIMARY KEY.
- post_likes has PRIMARY KEY (post_id, user_id).
- Comment delete uses deleted_at.
- Post Like and Unlike use relationship rows.

### 11.9 Feed Integration Rules

- GET /posts includes likeCount.
- GET /posts includes commentCount.
- GET /posts includes isLikedByMe.
- GET /posts/:postId uses the same fields.
- commentCount counts visible, non-deleted comments.
- likeCount counts stored likes.
- Counts must be consistent with the
  post visibility and moderation policies.
- The frontend should refresh relevant counts
  after successful write operations.

### 11.10 Frontend Integration Notes

Jan should:
- Use GET /posts/:postId/comments to show comments.
- Use POST /posts/:postId/comments to create comments.
- Use PATCH /comments/:commentId to edit own comments.
- Use DELETE /comments/:commentId to delete own comments.
- Use PUT /posts/:postId/like to like a post.
- Use DELETE /posts/:postId/like to unlike a post.
- Render author data from API responses.
- Display pagination correctly.
- Handle loading and error states.
- Update Like buttons using isLikedByMe.
- Use likeCount returned by the backend.
- Send authenticated cookies for write requests.
- Never rely on hidden edit buttons for security.

### 11.11 Pending Decisions

- Final comment maximum length
- Comment rate limiting thresholds
- Comment moderation policy
- Pagination cursor format
- Comment editing time limit, if any
- Final behavior for hidden parent posts
- Final response status for repeated deletes
- CSRF protection implementation
- Final API approval

---

## 12. Follow and Unfollow API

- Owner: Kin
- Frontend Integration: Peak and Jan
- Base Path: /api/v1/users
- Status: DRAFT

### 12.1 Follow User

- Method: PUT
- Path: /api/v1/users/:userId/follow
- Authentication Required: Yes

#### Path Parameter
- userId: Target user ID as a BIGINT string.

#### Request
- No JSON body required.
- The browser sends the session cookie.

#### Validation Rules
- Authentication is required.
- Target user must exist and be active.
- Users cannot follow themselves.
- Read followerId from the current session.
- Never trust followerId supplied by the client.
- Apply rate limiting to prevent abuse.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "User followed successfully.",
  "data": {
    "userId": "2",
    "isFollowing": true,
    "followerCount": 129
  }
}
```

#### Database Rules
- Use the follows table.
- follower_id = current authenticated user.
- following_id = target userId.
- PRIMARY KEY (follower_id, following_id).
- Prevent duplicate relationships.
- Repeated follow requests are treated as no-ops.
- Handle concurrent requests safely.
- Calculate followerCount from stored relationships.

#### Errors
- 400: Invalid userId
- 401: Unauthenticated
- 404: Target user unavailable
- 409: Cannot follow yourself
- 429: Too many requests
- 500: Internal server error

---

### 12.2 Unfollow User

- Method: DELETE
- Path: /api/v1/users/:userId/follow
- Authentication Required: Yes

#### Request
- No JSON body required.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "User unfollowed successfully.",
  "data": {
    "userId": "2",
    "isFollowing": false,
    "followerCount": 128
  }
}
```

#### Rules
- Authentication is required.
- Identify the follower through the session.
- Remove only the authenticated user's relationship.
- Do not remove another user's relationship.
- Repeated unfollow requests are safe no-ops.
- Validate the target user.
- Use parameterized SQL queries.
- Protect the request against CSRF.

#### Errors
- 400: Invalid userId
- 401: Unauthenticated
- 404: Target user unavailable
- 500: Internal server error

---

### 12.3 Get User Followers

- Method: GET
- Path: /api/v1/users/:userId/followers
- Authentication Required: No (initial proposal)

#### Query Parameters
- limit: optional, default 20, maximum 50
- cursor: optional pagination cursor

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Followers retrieved successfully.",
  "data": {
    "followers": [
      {
        "user": {
          "id": "3",
          "username": "student03",
          "displayName": "Example User",
          "avatarUrl": null
        },
        "followedAt": "2026-11-14T03:00:00Z"
      }
    ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

#### Rules
- Validate the target userId.
- Return only permitted public profile fields.
- Exclude inactive accounts from public lists.
- Support stable cursor pagination.
- Sort by created_at DESC and follower_id DESC.
- Treat pagination cursors as opaque.
- Never expose email or private profile fields.

#### Errors
- 400: Invalid userId or cursor
- 404: User unavailable
- 500: Internal server error

---

### 12.4 Get User Following

- Method: GET
- Path: /api/v1/users/:userId/following
- Authentication Required: No (initial proposal)

#### Query Parameters
- limit: optional, default 20, maximum 50
- cursor: optional pagination cursor

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Following list retrieved successfully.",
  "data": {
    "following": [
      {
        "user": {
          "id": "4",
          "username": "student04",
          "displayName": "Another Student",
          "avatarUrl": null
        },
        "followedAt": "2026-11-14T03:10:00Z"
      }
    ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

#### Rules
- Validate the target userId.
- Return only active, publicly visible accounts.
- Do not expose private contact information.
- Support cursor pagination.
- Sort by created_at DESC and following_id DESC.
- Use parameterized SQL queries.
- Return 404 for unavailable target users.

---

### 12.5 Get Follow Summary

- Method: GET
- Path: /api/v1/users/:userId/follow-summary
- Authentication Required: No (initial proposal)

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Follow summary retrieved successfully.",
  "data": {
    "userId": "2",
    "followerCount": 128,
    "followingCount": 65,
    "isFollowing": false
  }
}
```

#### Rules
- followerCount counts users following the target.
- followingCount counts accounts followed by the target.
- Counts and public lists must use consistent
  visibility and active-account filtering.
- isFollowing is true or false for logged-in users.
- isFollowing is null for anonymous visitors.
- Return false when viewing your own account.
- Validate the current session if provided.
- Do not trust current user identity from query data.
- Do not expose inactive target accounts publicly.

#### Errors
- 400: Invalid userId
- 404: User unavailable
- 500: Internal server error

---

### 12.6 Shared Follow Rules

- All user IDs use string representation in JSON.
- Follow relationships are directional.
- Duplicate Follow requests must not add rows.
- Unfollow removes only the current user's row.
- Prevent self-follow through backend validation.
- Follow relationships are public in the initial version.
- Private follow requests are outside initial scope.
- contactVisibility does not control follows.
- Check current account status on protected writes.
- Protect state-changing requests against CSRF.
- Apply rate limiting when appropriate.

### 12.7 Database Dependencies

Tables:
- users
- profiles
- follows

Relationships:
- follows.follower_id references users.id.
- follows.following_id references users.id.
- PRIMARY KEY (follower_id, following_id).

Proposed indexes:
- PRIMARY KEY (follower_id, following_id)
- INDEX (following_id, follower_id)

Additional pagination indexes must be reviewed
against the actual SQL queries.

### 12.8 Frontend Integration Notes

Peak and Jan should:
- Call GET /users/:userId/follow-summary on Profile.
- Call PUT /users/:userId/follow for Follow.
- Call DELETE /users/:userId/follow for Unfollow.
- Use GET /users/:userId/followers for followers.
- Use GET /users/:userId/following for following.
- Read isFollowing from the API response.
- Refresh the counts after successful updates.
- Hide the Follow button on your own Profile.
- Send authenticated cookies for write requests.
- Include the agreed CSRF protection.
- Handle 401, 404 and 409 errors correctly.
- Never rely on hidden buttons for authorization.

### 12.9 Pending Decisions

- Final visibility rules for follow lists
- Follow pagination cursor format
- Additional pagination indexes
- Rate limiting thresholds
- Policy for deactivated accounts
- CSRF protection implementation
- Final API approval

---

## 13. Hashtags and Search API

- Owner: Kin
- Frontend Integration: Jan
- Base Path: /api/v1/hashtags
- Status: DRAFT

### 13.1 Search Hashtags

- Method: GET
- Path: /api/v1/hashtags
- Authentication Required: No

#### Query Parameters

- query: required hashtag search term
- limit: optional, default 10, maximum 20

Example:
GET /api/v1/hashtags?query=port&limit=10

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Hashtags retrieved successfully.",
  "data": {
    "hashtags": [
      {
        "id": "1",
        "name": "portfolio",
        "postCount": 128
      },
      {
        "id": "2",
        "name": "portfolioreview",
        "postCount": 25
      }
    ]
  }
}
```

#### Validation Rules

- query is required.
- Reject empty or whitespace-only queries.
- Proposed query limit: 50 Unicode code points.
- Validate limit as a positive integer.
- Maximum result limit: 20.
- Accept letters, numbers, underscores and
  supported Unicode combining marks.
- Normalize the query before searching.
- An optional leading # may be stripped.
- Do not interpret user input as SQL syntax.
- Apply rate limiting when appropriate.

#### Search Rules

- Use the hashtags table.
- Search by normalized hashtag name.
- Support case-insensitive matching.
- Support Thai and English Unicode text.
- Use prefix matching in the initial version.
- Example: "port" matches "portfolio".
- Escape SQL LIKE wildcard characters.
- Sort results consistently by name.
- Return at most the requested limit.
- Return an empty array when no match exists.

#### Post Count Rules

- Count only publicly available posts.
- Exclude hidden posts.
- Exclude soft-deleted posts.
- Exclude posts from inactive accounts.
- Never count private or inaccessible content.
- Keep counts consistent with GET /posts.
- Optimize aggregate queries when necessary.

#### Errors

- 400: Invalid query parameters
- 422: Invalid search term
- 429: Too many requests
- 500: Internal server error

---

### 13.2 Get Hashtag Details

- Method: GET
- Path: /api/v1/hashtags/:name
- Authentication Required: No

#### Path Parameter

- name: normalized hashtag name

Example:
GET /api/v1/hashtags/portfolio

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Hashtag retrieved successfully.",
  "data": {
    "hashtag": {
      "id": "1",
      "name": "portfolio",
      "postCount": 128
    }
  }
}
```

#### Validation Rules

- name is required.
- Validate hashtag length and format.
- Normalize the supplied name.
- Reject invalid characters.
- Use safe parameterized SQL queries.
- Do not expose internal private data.

#### Details Rules

- Find the hashtag using its normalized name.
- Return 404 if the hashtag does not exist.
- Return its canonical stored name.
- Count only publicly available posts.
- Exclude hidden and soft-deleted posts.
- Exclude posts from inactive accounts.
- Return postCount as a non-negative integer.

#### Errors

- 400: Invalid hashtag name
- 404: Hashtag not found
- 500: Internal server error

---

### 13.3 Get Posts by Hashtag

This functionality already exists in Section 9.1.

- Method: GET
- Path: /api/v1/posts?hashtag=portfolio
- Authentication Required: No
- Owner: Kin

Example:
GET /api/v1/posts?hashtag=tcas&limit=20

#### Rules

- Reuse the GET /posts API.
- Do not create a duplicate route.
- Normalize the hashtag filter.
- Use post_hashtags to identify matching posts.
- Join hashtags to resolve the tag name.
- Return only visible, non-deleted posts.
- Exclude posts from inactive accounts.
- Use the existing Feed response format.
- Support limit, cursor, nextCursor and hasMore.
- Return an empty posts array for a valid
  hashtag that has no matching public posts.
- Validate malformed filters and cursors.
- Use consistent sorting and pagination.

This subsection documents an existing endpoint.
It does not add a new endpoint to the API count.

---

### 13.4 Hashtag Database Dependencies

Tables:
- hashtags
- post_hashtags
- posts
- users

Relationships:
- post_hashtags.post_id references posts.id.
- post_hashtags.hashtag_id references hashtags.id.
- posts.user_id references users.id.

Constraints:
- hashtags.name must be unique.
- post_hashtags has composite primary key:
  (post_id, hashtag_id).
- Duplicate hashtag relationships are not allowed.
- Deleted or hidden posts are excluded publicly.

### 13.5 Hashtag Normalization

- Store hashtags without the # symbol.
- Use a consistent Unicode normalization policy.
- Proposed normalization: NFC plus case normalization.
- Apply the same policy during extraction and search.
- Support Thai and English hashtag names.
- Confirm the final MySQL collation.
- Do not assume accent-insensitive comparisons
  are always appropriate.
- Enforce uniqueness on normalized names.
- Proposed maximum: 50 Unicode code points.
- Use consistent validation in every API.

### 13.6 Index and Performance Rules

- UNIQUE INDEX on hashtags(name).
- PRIMARY KEY (post_id, hashtag_id)
  on post_hashtags.
- INDEX (hashtag_id, post_id)
  on post_hashtags.
- Review the actual SQL queries with EXPLAIN.
- Avoid unnecessary full-table scans.
- Use safe parameterized queries.
- Avoid N+1 queries for Feed results.
- Consider caching only when needed.

### 13.7 Security Rules

- Hashtag search is publicly accessible.
- Only public posts can be returned.
- Never expose hidden moderation content.
- Validate query and path parameters.
- Prevent SQL injection.
- Escape LIKE wildcards in user input.
- Apply suitable search rate limits.
- Never return private user information.

### 13.8 Frontend Integration Notes

Jan should:
- Call GET /hashtags?query=... for suggestions.
- Call GET /hashtags/:name for tag details.
- Use GET /posts?hashtag=... for matching posts.
- Display hashtags with a # prefix in the UI.
- Send the canonical name in API requests.
- Encode query parameter values correctly.
- Use encodeURIComponent in JavaScript.
- Handle empty results and 404 responses.
- Use pagination for hashtag-filtered posts.
- Do not create a separate duplicate Feed format.

Example frontend flow:

1. User types "Port".
2. Frontend requests GET /hashtags?query=port.
3. User selects "portfolio".
4. Frontend opens the hashtag results page.
5. Frontend requests GET /posts?hashtag=portfolio.
6. Frontend renders the matching posts.

### 13.9 Pending Decisions

- Final Unicode normalization policy
- MySQL hashtag collation
- Search minimum query length
- Final allowed Unicode characters
- Post count optimization
- Search rate limiting
- Final hashtag length policy
- Final API approval

---

## 14. Social Feed - Post Reports API

- Owner: Kin
- Frontend Integration: Jan
- Admin Integration: Kin
- Status: DRAFT

### 14.1 Report Post

- Method: POST
- Path: /api/v1/posts/:postId/reports
- Authentication Required: Yes
- Content-Type: application/json

#### Path Parameter
- postId: valid BIGINT UNSIGNED identifier.

#### Request Body

```json
{
  "reason": "spam",
  "description": "This post contains repeated advertisements."
}
```

#### Allowed Report Reasons
- spam
- harassment
- inappropriate
- misinformation
- other

#### Validation Rules
- Authentication is required.
- The account must be active.
- The target post must exist.
- The post must be visible.
- The post must not be soft-deleted.
- Users cannot report their own posts.
- reason must match an allowed value.
- description is optional.
- Proposed description limit: 1000 characters.
- Reject unknown or protected fields.
- Never accept reporterId from the frontend.
- Apply rate limiting to prevent report spam.

#### Success Response: 201 Created

```json
{
  "success": true,
  "message": "Post report submitted successfully.",
  "data": {
    "report": {
      "id": "701",
      "postId": "100",
      "reason": "spam",
      "status": "pending",
      "createdAt": "2026-11-14T03:30:00Z"
    }
  }
}
```

#### Create Rules
- Get reporterId from the authenticated session.
- Verify that the target post exists.
- Verify that the reporter is not the post owner.
- Check report eligibility on the server.
- Create one report per user per post.
- Use the database UNIQUE constraint to prevent duplicates.
- Handle concurrent duplicate submissions safely.
- A duplicate report returns 409 Conflict.
- Set the initial status to pending.
- Do not allow the frontend to submit status.
- Do not automatically hide reported posts.
- Use parameterized SQL queries.
- Protect the request against CSRF.

#### Errors
- 400: Invalid postId or request
- 401: Unauthenticated
- 403: Cannot report own post
- 404: Post unavailable
- 409: Report already submitted
- 422: Invalid report data
- 429: Too many requests
- 500: Internal server error

---

### 14.2 Get My Reports

- Method: GET
- Path: /api/v1/reports/me
- Authentication Required: Yes

#### Query Parameters
- limit: optional, default 20, maximum 50
- cursor: optional pagination cursor

Example:
GET /api/v1/reports/me?limit=20

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Your reports retrieved successfully.",
  "data": {
    "reports": [
      {
        "id": "701",
        "postId": "100",
        "reason": "spam",
        "description": "This post contains repeated advertisements.",
        "status": "pending",
        "createdAt": "2026-11-14T03:30:00Z"
      }
    ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

#### Rules
- Authentication is required.
- Get reporterId from the session.
- Return only reports created by the current user.
- Never return another user's reports.
- Sort by created_at DESC, id DESC.
- Use stable cursor-based pagination.
- Validate limit and cursor.
- Treat pagination cursors as opaque.
- Never return admin_note.
- Never expose reviewed_by to regular users.
- Never expose internal moderation metadata.
- Report history may remain available even if
  the original post is no longer public.
- Do not expose hidden post content.
- Use parameterized SQL queries.

#### Errors
- 400: Invalid query parameters
- 401: Unauthenticated
- 500: Internal server error

---

### 14.3 Report Status Rules

Allowed statuses:
- pending
- dismissed
- action_taken

#### pending
- The report has been submitted.
- Admin review is not completed.

#### dismissed
- An authorized admin reviewed the report.
- No moderation action was taken for that report.

#### action_taken
- An authorized admin reviewed the report.
- A moderation action was recorded.

#### Status Security
- Users cannot change report status.
- Users cannot assign reviewed_by.
- Users cannot write admin_note.
- Only authorized Admin APIs may review reports.
- State transitions must be validated.
- Successful moderation actions must be audited.

---

### 14.4 Database Dependencies

Tables:
- users
- posts
- post_reports
- admin_audit_logs (for later Admin actions)

Relationships:
- post_reports.post_id references posts.id.
- post_reports.reporter_id references users.id.
- post_reports.reviewed_by references users.id.

Constraints:
- PRIMARY KEY (id)
- UNIQUE (post_id, reporter_id)

Proposed indexes:
- INDEX (status, created_at, id)
- INDEX (reporter_id)

Additional pagination indexes should be reviewed
against the final SQL queries.

---

### 14.5 Report Privacy and Security

- Reporter identity must remain private.
- Post authors cannot access reporter information.
- Regular users cannot view all submitted reports.
- Users can view only their own report history.
- Admin-only review fields must never appear
  in regular user API responses.
- Never trust reporterId or role from the client.
- Apply CSRF protection to POST requests.
- Apply rate limiting and input validation.
- Avoid logging unnecessary sensitive details.
- Do not publicly display report counts.
- A report does not automatically hide a post.
- Define data retention before production.

---

### 14.6 Frontend Integration Notes

Jan should:
- Add a Report option to the post menu.
- Show a form for selecting the report reason.
- Allow an optional description.
- Call POST /posts/:postId/reports.
- Send authenticated session cookies.
- Include the agreed CSRF protection.
- Show confirmation after a successful request.
- Handle 401 by directing users to Login.
- Handle 403 for self-report restrictions.
- Handle 409 when a report already exists.
- Never submit reporterId or status.
- Never hide a post automatically after reporting.

Optional user report history:
- GET /reports/me
- Show only the current user's reports.
- Display reason, status and submission date.
- Do not show private Admin review notes.

---

### 14.7 Admin Integration Notes

Kin's Admin Backend will later:
- Retrieve pending reports.
- Review report details.
- Dismiss reports.
- Take authorized moderation actions.
- Update reviewed_by and reviewed_at.
- Record the action in admin_audit_logs.
- Protect every Admin endpoint.
- Use transactions for related database changes.

Admin endpoints will be documented separately
in the Admin API section.

---

### 14.8 Pending Decisions

- Final report reason policy
- Final description length limit
- Report creation rate limits
- Report history visibility
- Report retention period
- Admin review workflow
- Final report status transitions
- Handling of deleted reported posts
- CSRF protection implementation
- Final API approval

---

## 15. Social Feed API Review

Status: DRAFT REVIEW - Pending final implementation

### 15.1 Endpoint Groups

- Posts: 5 endpoints
- Post Media: 2 endpoints
- Comments and Likes: 6 endpoints
- Follow and Unfollow: 5 endpoints
- Hashtags and Search: 2 new endpoints
- Post Reports: 2 endpoints

Total Social Feed endpoints: 22

Note:
GET /posts?hashtag=... reuses an existing route.

### 15.2 Response Consistency

- Use one standard success/error response structure.
- Serialize all BIGINT IDs as strings.
- Return timestamps in ISO 8601 UTC.
- Use consistent Post, Media and Author objects.
- Use null for isLikedByMe when unauthenticated.
- Use null for isFollowing when unauthenticated.
- Use true or false for authenticated users.
- Ensure response examples match authentication context.
- Return actual persisted media after uploads.

### 15.3 Authentication and Authorization

- Only authenticated users can create content.
- Only content owners can edit their own content.
- Only authorized admins can moderate content.
- Never trust client-supplied userId or role.
- Check account status on protected operations.
- Protect state-changing requests against CSRF.
- Apply suitable request rate limits.
- Do not expose private reports or moderation notes.

### 15.4 Database Consistency

- Posts use users, profiles and posts.
- Images use post_media.
- Comments use comments.
- Likes use post_likes.
- Follows use follows.
- Hashtags use hashtags and post_hashtags.
- Reports use post_reports.
- Moderation audits use admin_audit_logs.
- Use parameterized SQL queries.
- Enforce unique constraints in MySQL.
- Use transactions for related database writes.
- Handle external file storage failures safely.

### 15.5 Frontend Integration

- Jan owns the Social Feed frontend.
- Peak integrates profile follow controls.
- Kin owns Social Feed backend APIs.
- All endpoints use the /api/v1 prefix.
- Share field names and response examples.
- Frontend must handle loading and error states.
- Frontend must send session cookies when required.
- Backend authorization cannot rely on hidden buttons.

### 15.6 Pending Before Implementation

- Final CSRF protection mechanism
- Session cookie and CORS configuration
- Final upload and storage policy
- Final text and media limits
- Cursor pagination implementation
- Final moderation and visibility policy
- MySQL schema and index testing
- Team API contract approval

### 15.7 Review Conclusion

- Endpoint documentation: Draft complete
- Endpoint count verification: Pending local check
- Request/response consistency: Requires final review
- Security requirements: Documented as draft
- Database integration: Not implemented
- API integration tests: Not started

This review does not mean the APIs are implemented
or approved for production.
