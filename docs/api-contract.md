
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

---

## 16. Portfolio API - Main Portfolio

- Owner: Kin
- Frontend Integration: Jan
- Database: portfolios
- Status: DRAFT

### 16.1 Get My Portfolio

- Method: GET
- Path: /api/v1/portfolios/me
- Authentication Required: Yes

#### Request
- No JSON body required.
- Browser sends the session cookie.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio retrieved successfully.",
  "data": {
    "portfolio": {
      "id": "301",
      "userId": "1",
      "title": "My Game Development Portfolio",
      "summary": "My projects and creative works.",
      "visibility": "private",
      "createdAt": "2026-11-14T03:00:00Z",
      "updatedAt": "2026-11-14T03:00:00Z",
      "deletedAt": null
    }
  }
}
```

#### Rules
- Authentication is required.
- Get userId from the session.
- Return only the current user's portfolio.
- Include both public and private portfolios.
- A soft-deleted portfolio may be returned to
  its owner with deletedAt set, for restoration.
- Never expose another user's private portfolio.
- Do not return password or session information.

#### Errors
- 401: Unauthenticated
- 404: Portfolio does not exist
- 500: Internal server error

---

### 16.2 Get Public User Portfolio

- Method: GET
- Path: /api/v1/users/:userId/portfolio
- Authentication Required: No

#### Path Parameter
- userId: valid BIGINT UNSIGNED identifier.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Public portfolio retrieved successfully.",
  "data": {
    "portfolio": {
      "id": "301",
      "userId": "1",
      "title": "My Game Development Portfolio",
      "summary": "My projects and creative works.",
      "visibility": "public",
      "createdAt": "2026-11-14T03:00:00Z",
      "updatedAt": "2026-11-14T03:00:00Z"
    }
  }
}
```

#### Rules
- Only public portfolios are accessible.
- Private portfolios are not returned.
- Soft-deleted portfolios are not returned.
- Portfolios of inactive users are not public.
- Return 404 for unavailable portfolios.
- Do not expose private user information.
- Validate the userId path parameter.
- Portfolio items are retrieved through
  endpoints defined in the next section.

#### Errors
- 400: Invalid userId
- 404: Portfolio unavailable
- 500: Internal server error

---

### 16.3 Create Portfolio

- Method: POST
- Path: /api/v1/portfolios
- Authentication Required: Yes
- Content-Type: application/json

#### Request Body

```json
{
  "title": "My Game Development Portfolio",
  "summary": "A collection of my game projects.",
  "visibility": "private"
}
```

#### Validation Rules
- Authentication is required.
- title is required.
- title must not be empty after trimming.
- Proposed title limit: 150 characters.
- summary is optional.
- Proposed summary limit: 3000 characters.
- visibility accepts: private, public.
- Default visibility is private.
- Reject unknown and protected fields.
- Never accept userId from the frontend.

#### Create Rules
- Use userId from the session.
- Each user can have one main portfolio.
- Check existing portfolio records.
- Enforce UNIQUE (user_id) in MySQL.
- Handle concurrent duplicate creation safely.
- If an active portfolio exists, return 409.
- If a soft-deleted portfolio exists, return
  409 and require the restore endpoint.
- Do not create a duplicate portfolio.
- Use parameterized SQL queries.

#### Success Response: 201 Created

```json
{
  "success": true,
  "message": "Portfolio created successfully.",
  "data": {
    "portfolio": {
      "id": "301",
      "userId": "1",
      "title": "My Game Development Portfolio",
      "summary": "A collection of my game projects.",
      "visibility": "private",
      "createdAt": "2026-11-14T03:00:00Z",
      "updatedAt": "2026-11-14T03:00:00Z",
      "deletedAt": null
    }
  }
}
```

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 409: Portfolio already exists or requires restore
- 422: Validation failed
- 429: Too many requests
- 500: Internal server error

---

### 16.4 Update My Portfolio

- Method: PATCH
- Path: /api/v1/portfolios/me
- Authentication Required: Yes
- Content-Type: application/json

#### Request Body

```json
{
  "title": "Updated Game Portfolio",
  "summary": "My latest development projects.",
  "visibility": "public"
}
```

#### Editable Fields
- title
- summary
- visibility

#### Validation Rules
- Authentication is required.
- Update only supplied fields.
- At least one editable field is required.
- title cannot be empty or null.
- summary may be set to null.
- visibility accepts private or public.
- Reject unknown and protected fields.
- Do not allow changes to id or userId.
- The portfolio must not be soft-deleted.

#### Update Rules
- Identify the owner using the session.
- Only the owner can edit the portfolio.
- Validate all submitted fields.
- Preserve created_at.
- Update updated_at.
- Use parameterized SQL queries.
- Visibility changes take effect immediately
  in public portfolio API responses.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio updated successfully.",
  "data": {
    "portfolio": {
      "id": "301",
      "userId": "1",
      "title": "Updated Game Portfolio",
      "summary": "My latest development projects.",
      "visibility": "public",
      "updatedAt": "2026-11-14T04:00:00Z"
    }
  }
}
```

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 404: Portfolio not found
- 409: Portfolio is soft-deleted
- 422: Validation failed
- 500: Internal server error

---

### 16.5 Delete My Portfolio

- Method: DELETE
- Path: /api/v1/portfolios/me
- Authentication Required: Yes

#### Request
- No JSON body required.

#### Delete Rules
- Authentication is required.
- Identify the current user through the session.
- Only the portfolio owner can delete it.
- Use soft delete.
- Set portfolios.deleted_at to current UTC time.
- Do not physically delete the portfolio.
- Preserve portfolio_items for possible recovery.
- Hide the portfolio and its items publicly.
- Repeated deletion may be treated as a no-op.
- Protect the request against CSRF.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio deleted successfully.",
  "data": null
}
```

#### Errors
- 401: Unauthenticated
- 404: Portfolio not found
- 500: Internal server error

---

### 16.6 Restore My Portfolio

- Method: POST
- Path: /api/v1/portfolios/me/restore
- Authentication Required: Yes

#### Request
- No JSON body required.

#### Restore Rules
- Authentication is required.
- Identify the owner through the session.
- Only the owner can restore a portfolio.
- The portfolio must already exist.
- The portfolio must be soft-deleted.
- Restoration must follow retention policy.
- Set portfolios.deleted_at to NULL.
- Preserve its original portfolio ID.
- Preserve its existing portfolio_items.
- Soft-deleted individual items remain deleted.
- Do not create a second portfolio row.
- Protect the request against CSRF.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio restored successfully.",
  "data": {
    "portfolio": {
      "id": "301",
      "userId": "1",
      "title": "My Game Development Portfolio",
      "visibility": "private",
      "deletedAt": null
    }
  }
}
```

#### Errors
- 401: Unauthenticated
- 404: Portfolio not found
- 409: Portfolio is not deleted
- 500: Internal server error

---

### 16.7 Portfolio Visibility Rules

Allowed values:
- private
- public

#### Private
- Visible to the portfolio owner only.
- Not accessible through public Portfolio APIs.
- Items must not be publicly accessible.
- Admin access requires explicit authorization.

#### Public
- Public metadata can be viewed without Login.
- Public items may be viewed when the parent
  portfolio is publicly available.
- Only approved profile information is exposed.

#### Soft Deleted
- Not accessible through public APIs.
- Items must not be publicly accessible.
- Owner may restore the portfolio.
- Retention policy determines restoration period.

### 16.8 Database Dependencies

Tables:
- users
- portfolios
- portfolio_items

Relationships:
- portfolios.user_id references users.id.
- portfolio_items.portfolio_id references portfolios.id.

Constraints:
- portfolios.id is PRIMARY KEY.
- portfolios.user_id is UNIQUE.
- portfolios.user_id is FOREIGN KEY.
- deleted_at is used for soft deletion.

Rules:
- Use parameterized SQL queries.
- Use authenticated userId for ownership checks.
- Prevent duplicate main portfolios.
- Apply database transactions where required.
- Never trust userId sent by the frontend.

### 16.9 Frontend Integration Notes

Jan should:
- Use GET /portfolios/me for the owner's page.
- Use POST /portfolios to create a portfolio.
- Use PATCH /portfolios/me for edits.
- Use PATCH /portfolios/me to change visibility.
- Use DELETE /portfolios/me for soft deletion.
- Use POST /portfolios/me/restore for recovery.
- Use GET /users/:userId/portfolio for public views.
- Handle 401, 404, 409 and 422 errors.
- Send authenticated cookies for private APIs.
- Include CSRF protection for write operations.
- Never use hidden UI controls as security.

### 16.10 Pending Decisions

- Final portfolio title and summary limits
- Portfolio deletion retention policy
- Whether onboarding is required for creation
- Public item visibility rules
- Portfolio item limits
- CSRF protection implementation
- Final API approval

---

## 17. Portfolio Items API

- Owner: Kin
- Frontend Integration: Jan
- Base Path: /api/v1/portfolios
- Database: portfolio_items
- Status: DRAFT

### 17.1 Get My Portfolio Items

- Method: GET
- Path: /api/v1/portfolios/me/items
- Authentication Required: Yes

#### Query Parameters
- includeDeleted: optional, default false
- Allowed values: true, false

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio items retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "501",
        "portfolioId": "301",
        "itemType": "project",
        "title": "3D Adventure Game",
        "description": "A game developed with Unity.",
        "imageUrl": "/uploads/portfolio/game.webp",
        "externalUrl": "https://example.com/project",
        "sortOrder": 0,
        "createdAt": "2026-11-14T03:00:00Z",
        "updatedAt": "2026-11-14T03:00:00Z",
        "deletedAt": null
      }
    ]
  }
}
```

#### Rules
- Authentication is required.
- Get userId from the session.
- Find the portfolio owned by the current user.
- Return only items belonging to that portfolio.
- Exclude soft-deleted items by default.
- includeDeleted=true is available to the owner.
- Sort by sort_order ASC, id ASC.
- A soft-deleted parent portfolio must not
  expose items through normal active views.
- A portfolio must exist.
- Do not expose internal file keys.
- Never return another user's private items.

#### Errors
- 400: Invalid query
- 401: Unauthenticated
- 404: Portfolio not found
- 500: Internal server error

---

### 17.2 Get Public Portfolio Items

- Method: GET
- Path: /api/v1/users/:userId/portfolio/items
- Authentication Required: No

#### Path Parameter
- userId: valid BIGINT UNSIGNED identifier.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Public portfolio items retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "501",
        "itemType": "project",
        "title": "3D Adventure Game",
        "description": "A Unity project.",
        "imageUrl": "/uploads/portfolio/game.webp",
        "externalUrl": "https://example.com/project",
        "sortOrder": 0
      }
    ]
  }
}
```

#### Rules
- The target user must exist and be active.
- The portfolio must be public.
- The portfolio must not be soft-deleted.
- Return only non-deleted items.
- Sort by sort_order ASC, id ASC.
- Never expose internal file keys.
- Never expose private portfolio data.
- Return 404 when the portfolio is unavailable.

#### Errors
- 400: Invalid userId
- 404: Portfolio unavailable
- 500: Internal server error

---

### 17.3 Create Portfolio Item

- Method: POST
- Path: /api/v1/portfolios/me/items
- Authentication Required: Yes
- Content-Type: application/json

#### Request Body

```json
{
  "itemType": "project",
  "title": "3D Adventure Game",
  "description": "A game developed using Unity.",
  "externalUrl": "https://example.com/project"
}
```

#### Allowed Item Types
- project
- certificate
- activity

#### Validation Rules
- Authentication is required.
- The user must own the portfolio.
- The portfolio must exist and be active.
- itemType is required.
- title is required.
- Reject empty or whitespace-only titles.
- Proposed title limit: 150 characters.
- description is optional.
- externalUrl is optional.
- Only allow safe HTTPS external URLs.
- Reject unknown fields.
- Proposed maximum: 30 active items.

#### Create Rules
- Get userId from the session.
- Find the current user's portfolio.
- Reject creation in soft-deleted portfolios.
- Validate the item count.
- Prevent concurrent requests from
  exceeding the item limit.
- Assign a sortOrder after existing items.
- Create a new portfolio_items record.
- image_key is initially NULL.
- Do not accept portfolioId from the frontend.
- Use parameterized SQL queries.
- Protect the request against CSRF.

#### Success Response: 201 Created

```json
{
  "success": true,
  "message": "Portfolio item created successfully.",
  "data": {
    "item": {
      "id": "501",
      "portfolioId": "301",
      "itemType": "project",
      "title": "3D Adventure Game",
      "description": "A game developed using Unity.",
      "imageUrl": null,
      "externalUrl": "https://example.com/project",
      "sortOrder": 0,
      "createdAt": "2026-11-14T03:00:00Z"
    }
  }
}
```

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 404: Portfolio not found
- 409: Portfolio inactive or item limit reached
- 422: Validation failed
- 429: Too many requests
- 500: Internal server error

---

### 17.4 Update Portfolio Item

- Method: PATCH
- Path: /api/v1/portfolios/me/items/:itemId
- Authentication Required: Yes
- Content-Type: application/json

#### Request Body

```json
{
  "itemType": "project",
  "title": "Updated Game Project",
  "description": "An improved Unity project.",
  "externalUrl": "https://example.com/updated"
}
```

#### Editable Fields
- itemType
- title
- description
- externalUrl

#### Validation Rules
- Authentication is required.
- The item must exist.
- The item must belong to the owner's portfolio.
- The parent portfolio must be active.
- The item must not be soft-deleted.
- At least one editable field is required.
- Validate itemType and title.
- Reject unknown or protected fields.
- description and externalUrl may be cleared.
- Reject unsafe external URLs.

#### Update Rules
- Identify the current user from the session.
- Verify portfolio and item ownership.
- Update only supplied fields.
- Preserve created_at.
- Update updated_at.
- Do not allow changes to portfolioId or itemId.
- Image changes use the separate image endpoint.
- Ordering uses the separate order endpoint.
- Use parameterized SQL queries.
- Protect the request against CSRF.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio item updated successfully.",
  "data": {
    "item": {
      "id": "501",
      "itemType": "project",
      "title": "Updated Game Project",
      "description": "An improved Unity project.",
      "externalUrl": "https://example.com/updated",
      "updatedAt": "2026-11-14T04:00:00Z"
    }
  }
}
```

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 404: Item not found
- 409: Portfolio or item inactive
- 422: Validation failed
- 500: Internal server error

---

### 17.5 Delete Portfolio Item

- Method: DELETE
- Path: /api/v1/portfolios/me/items/:itemId
- Authentication Required: Yes

#### Delete Rules
- Authentication is required.
- Only the portfolio owner can delete items.
- Verify that the item belongs to the portfolio.
- The parent portfolio must be active.
- Use soft delete.
- Set portfolio_items.deleted_at to current UTC time.
- Do not physically delete the item.
- Preserve image references during retention.
- Hide deleted items from public APIs.
- Repeated deletion may be treated as a no-op.
- Protect the request against CSRF.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio item deleted successfully.",
  "data": null
}
```

#### Errors
- 401: Unauthenticated
- 404: Item not found
- 409: Parent portfolio inactive
- 500: Internal server error

---

### 17.6 Restore Portfolio Item

- Method: POST
- Path: /api/v1/portfolios/me/items/:itemId/restore
- Authentication Required: Yes

#### Restore Rules
- Authentication is required.
- Verify the item belongs to the current user.
- The parent portfolio must be active.
- The item must be soft-deleted.
- Restore only within the allowed retention period.
- Check the active item count before restoration.
- Do not exceed the maximum active item limit.
- Set portfolio_items.deleted_at to NULL.
- Preserve the original item ID.
- Assign the item a valid sortOrder.
- Do not create a duplicate item row.
- Protect the request against CSRF.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio item restored successfully.",
  "data": {
    "item": {
      "id": "501",
      "title": "3D Adventure Game",
      "deletedAt": null
    }
  }
}
```

#### Errors
- 401: Unauthenticated
- 404: Item not found
- 409: Item not deleted or item limit reached
- 500: Internal server error

---

### 17.7 Reorder Portfolio Items

- Method: PUT
- Path: /api/v1/portfolios/me/items/order
- Authentication Required: Yes
- Content-Type: application/json

#### Request Body

```json
{
  "itemIds": ["503", "501", "502"]
}
```

#### Validation Rules
- Authentication is required.
- The parent portfolio must be active.
- itemIds must be an array.
- IDs must be valid BIGINT strings.
- All supplied IDs must belong to the owner.
- All supplied items must be active.
- Duplicate item IDs are not allowed.
- The array must contain every active item
  exactly once in the initial design.
- Reject missing, extra or foreign item IDs.

#### Reorder Rules
- Get the portfolio from the current session user.
- Lock or otherwise protect the relevant rows
  during concurrent reorder operations.
- Update sort_order based on array position.
- First item gets sort_order = 0.
- Second item gets sort_order = 1.
- Continue sequentially.
- Use one database transaction.
- Roll back all changes if any item fails.
- Return the updated order.
- Protect the request against CSRF.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio items reordered successfully.",
  "data": {
    "itemIds": ["503", "501", "502"]
  }
}
```

#### Errors
- 400: Invalid itemIds
- 401: Unauthenticated
- 404: Portfolio unavailable
- 409: Invalid or outdated item set
- 422: Validation failed
- 500: Internal server error

---

### 17.8 Upload or Replace Item Image

- Method: PUT
- Path: /api/v1/portfolios/me/items/:itemId/image
- Authentication Required: Yes
- Content-Type: multipart/form-data

#### Form Data
- Field name: image
- Field type: File

#### Proposed Upload Rules
- One image per portfolio item.
- Allowed types: JPEG, PNG, WebP.
- Proposed maximum size: 5 MB.
- Validate actual file contents.
- Reject malformed or unsupported images.
- Generate a safe unique file key.
- Never trust the original filename.
- Store the file outside MySQL.
- Save the reference in image_key.

#### Replace Rules
- Verify the authenticated portfolio owner.
- Verify the item belongs to the portfolio.
- Reject uploads to soft-deleted items.
- Reject uploads to inactive portfolios.
- Store the new image safely.
- Update image_key in MySQL.
- Preserve the previous image if replacement fails.
- Clean up the previous image after a successful
  replacement when no record references it.
- Handle external storage failures separately.
- Never expose internal file paths or credentials.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio item image saved successfully.",
  "data": {
    "itemId": "501",
    "imageUrl": "/uploads/portfolio/game.webp"
  }
}
```

#### Errors
- 400: Missing or invalid image
- 401: Unauthenticated
- 404: Item unavailable
- 409: Portfolio or item inactive
- 413: File too large
- 415: Unsupported media type
- 422: Invalid image
- 500: Internal server error

---

### 17.9 Delete Portfolio Item Image

- Method: DELETE
- Path: /api/v1/portfolios/me/items/:itemId/image
- Authentication Required: Yes

#### Delete Rules
- Authentication is required.
- Verify the portfolio owner.
- Verify item ownership.
- Reject modifications to deleted items.
- Set image_key to NULL.
- Keep the portfolio item record.
- Safely clean up the old image file.
- Do not delete images belonging to other items.
- Repeated delete requests may be no-ops.
- Protect the request against CSRF.

#### Success Response: 200 OK

```json
{
  "success": true,
  "message": "Portfolio item image removed successfully.",
  "data": {
    "itemId": "501",
    "imageUrl": null
  }
}
```

#### Errors
- 401: Unauthenticated
- 404: Item unavailable
- 409: Portfolio or item inactive
- 500: Internal server error

---

### 17.10 Shared Portfolio Item Rules

- Authentication is required for modifications.
- Only the owner can manage portfolio items.
- Public APIs return only publicly available items.
- Private portfolios must not expose item data.
- Soft-deleted portfolios cannot be modified.
- Soft-deleted items are excluded by default.
- Use BIGINT identifiers as strings in JSON.
- Use ISO 8601 UTC timestamps.
- Never trust userId or portfolioId from the client.
- Use parameterized SQL queries.
- Protect state-changing operations against CSRF.
- Validate all supported item types.
- Validate safe external URLs.
- Apply image upload limits and validation.
- Use transactions for related database writes.
- Handle file storage failures safely.

### 17.11 Database Dependencies

Tables:
- users
- portfolios
- portfolio_items

Relationships:
- portfolios.user_id references users.id.
- portfolio_items.portfolio_id references portfolios.id.

Fields:
- id
- portfolio_id
- item_type
- title
- description
- image_key
- external_url
- sort_order
- created_at
- updated_at
- deleted_at

Proposed Index:
- INDEX (portfolio_id, sort_order, id)

Database Notes:
- One portfolio belongs to one user.
- One portfolio can contain many items.
- One image is supported per item initially.
- Deleted items use deleted_at.
- The final ON DELETE policy is pending approval.

### 17.12 Frontend Integration Notes

Jan should:
- Call GET /portfolios/me/items for own items.
- Call GET /users/:userId/portfolio/items
  to display public items.
- Call POST /portfolios/me/items to create an item.
- Call PATCH /portfolios/me/items/:itemId to edit.
- Call DELETE /portfolios/me/items/:itemId to delete.
- Call POST /portfolios/me/items/:itemId/restore
  to restore a soft-deleted item.
- Call PUT /portfolios/me/items/order for reordering.
- Use FormData for item image uploads.
- Use the form field name "image".
- Call DELETE /portfolios/me/items/:itemId/image
  to remove an item image.
- Display the latest saved order.
- Respect public and private portfolio visibility.
- Handle validation and upload errors.
- Send session cookies on protected requests.
- Include the agreed CSRF protection.

### 17.13 Pending Decisions

- Final maximum number of portfolio items
- Final description length limit
- Image storage provider
- Maximum upload file size
- External URL validation policy
- Reorder concurrency implementation
- Soft-delete restoration period
- Image cleanup strategy
- CSRF protection implementation
- Final API approval

---

## 18. Portfolio API Review

- Project: UniGO!
- Backend Owner: Kin
- Frontend Integration: Jan
- Status: DRAFT REVIEW
- API Implementation: NOT STARTED

### 18.1 Endpoint Review

Main Portfolio API - Section 16:
- GET /api/v1/portfolios/me
- GET /api/v1/users/:userId/portfolio
- POST /api/v1/portfolios
- PATCH /api/v1/portfolios/me
- DELETE /api/v1/portfolios/me
- POST /api/v1/portfolios/me/restore

Total Main Portfolio Endpoints: 6

Portfolio Items API - Section 17:
- GET /api/v1/portfolios/me/items
- GET /api/v1/users/:userId/portfolio/items
- POST /api/v1/portfolios/me/items
- PATCH /api/v1/portfolios/me/items/:itemId
- DELETE /api/v1/portfolios/me/items/:itemId
- POST /api/v1/portfolios/me/items/:itemId/restore
- PUT /api/v1/portfolios/me/items/order
- PUT /api/v1/portfolios/me/items/:itemId/image
- DELETE /api/v1/portfolios/me/items/:itemId/image

Total Portfolio Item Endpoints: 9

Total Portfolio Endpoints: 15
Total Documented API Endpoints: 49

### 18.2 Database Relationship Review

Required tables:
- users
- portfolios
- portfolio_items

Relationships:
- portfolios.user_id references users.id.
- portfolio_items.portfolio_id references portfolios.id.

Constraints:
- portfolios.id is PRIMARY KEY.
- portfolios.user_id is UNIQUE.
- portfolio_items.id is PRIMARY KEY.
- All ID foreign key types must match.

Rules:
- One user can have at most one main portfolio.
- One portfolio can contain multiple items.
- Each item belongs to exactly one portfolio.
- Use BIGINT UNSIGNED IDs.
- Serialize BIGINT IDs as strings in JSON.
- Use parameterized SQL queries.

### 18.3 Authentication and Ownership Review

- Private owner APIs require authentication.
- The backend identifies the owner from the session.
- Do not accept userId as proof of ownership.
- Never trust portfolioId supplied by the frontend.
- Never trust role values from the frontend.
- Verify item ownership through its parent portfolio.
- Regular users cannot edit another user's items.
- Inactive accounts cannot perform protected actions.
- Protect state-changing endpoints against CSRF.
- Return only authorized information.
- Review 403 and 404 behavior to avoid information leaks.

### 18.4 Portfolio Visibility Review

Allowed portfolio visibility:
- private
- public

Private Portfolio:
- Accessible through owner-authorized APIs.
- Not available through public portfolio APIs.
- Items are not publicly accessible.
- Private image files must require authorized access.
- A hidden UI does not protect private files.

Public Portfolio:
- Public metadata may be accessed without Login.
- Only active, non-deleted items are publicly visible.
- Inactive account portfolios must not appear.
- File delivery must follow the visibility policy.

Soft-Deleted Portfolio:
- Not visible through public APIs.
- Must not allow item creation or modification.
- Owner may view deletion state for restoration.
- Restore behavior must follow retention policy.

Security Decision:
- Proposed: use private file storage.
- Authorize file access or issue short-lived signed URLs.
- Never expose private files through unrestricted URLs.
- Final media delivery approach is pending approval.

### 18.5 Portfolio and Item Deletion Review

Portfolio Soft Delete:
- Set portfolios.deleted_at.
- Hide the portfolio and all items publicly.
- Preserve item records.
- Do not trigger SQL ON DELETE CASCADE.
- Allow owner restoration if retention permits.

Portfolio Restore:
- Restore the original portfolio record.
- Do not insert a duplicate portfolio.
- Preserve the existing portfolio ID.
- Restore parent accessibility.
- Do not automatically restore individually
  soft-deleted items.
- Proposed: reset visibility to private on restore.
- Final visibility restoration policy is pending.

Item Soft Delete:
- Set portfolio_items.deleted_at.
- Do not physically delete the item.
- Exclude deleted items from public responses.
- Preserve image references during retention.

Item Restore:
- Verify the current user owns the item.
- The parent portfolio must be active.
- Check maximum active item count.
- Restore the original item record.
- Assign a valid display order.

### 18.6 Portfolio Image Review

- One image per item in the initial version.
- Store image files outside MySQL.
- Store the reference in portfolio_items.image_key.
- Validate actual file content and file size.
- Allow JPEG, PNG and WebP as proposed formats.
- Generate secure unique file keys.
- Do not trust original uploaded filenames.
- Do not expose internal storage credentials.
- Never allow executable uploaded files.

Replacement Rules:
- Verify item ownership before replacement.
- Reject uploads to soft-deleted items.
- Store the new file safely.
- Update the database reference.
- Preserve the old image if replacement fails.
- Delete old storage files only after the new
  reference is successfully committed.
- Handle orphaned files through safe cleanup.
- Enforce private/public file access rules.

### 18.7 Portfolio Item Ordering Review

- Use portfolio_items.sort_order.
- The owner can reorder active items.
- Reject duplicate item IDs.
- Reject IDs belonging to other portfolios.
- Reject deleted or nonexistent item IDs.
- Require the complete active item set.
- Use one database transaction for reordering.
- Handle concurrent updates consistently.
- Assign sequential sort_order values.
- Sort output by sort_order ASC, id ASC.
- Roll back all order changes if validation fails.

### 18.8 Request and Response Consistency

- Use the shared API success/error response shape.
- Use camelCase field names in JSON.
- Use snake_case column names in MySQL.
- Map image_key to authorized imageUrl.
- Use string IDs in JSON responses.
- Return ISO 8601 UTC timestamps.
- Return null for missing optional fields.
- Keep Item responses consistent across endpoints.
- Apply the same visibility rules to all public APIs.
- Never expose private storage keys.
- Validate request bodies and path parameters.
- Use consistent pagination if item limits expand.

### 18.9 Validation and Security Review

- Validate portfolio titles and summaries.
- Validate item types: project, certificate, activity.
- Validate maximum item count.
- Validate description length.
- Validate external HTTPS URLs.
- Reject unsupported URL schemes.
- Do not fetch user-provided URLs without
  additional server-side safety controls.
- Apply file upload size limits.
- Apply appropriate rate limits.
- Protect session-authenticated write operations.
- Do not expose private fields in public responses.

### 18.10 Test Scenarios Before Implementation Approval

Required future test cases:
- Create first portfolio successfully.
- Reject duplicate portfolio creation.
- Reject portfolio creation without Login.
- Update portfolio as its owner.
- Reject unauthorized portfolio updates.
- Hide private portfolios from public APIs.
- Hide soft-deleted portfolios from public APIs.
- Restore a soft-deleted portfolio.
- Create valid portfolio items.
- Reject invalid item types.
- Reject adding more than the item limit.
- Reject modifying another user's item.
- Soft-delete and restore an item.
- Reorder active portfolio items.
- Reject duplicate IDs during reordering.
- Reject IDs from another portfolio.
- Upload and replace an item image.
- Reject invalid and oversized images.
- Preserve the old image when replacement fails.
- Prevent unauthorized access to private images.
- Verify correct item visibility after deletion.

Test status: NOT STARTED

### 18.11 Pending Decisions

- Final file storage provider
- Private image delivery strategy
- Portfolio restoration visibility
- Final retention and deletion policy
- Maximum number of portfolio items
- Final image size limits
- Reorder concurrency implementation
- CSRF protection mechanism
- MySQL schema implementation
- Frontend integration confirmation with Jan

### 18.12 Review Conclusion

- Main Portfolio Contract: DRAFT COMPLETE
- Portfolio Items Contract: DRAFT COMPLETE
- Endpoint count verification: PENDING LOCAL CHECK
- Database consistency: LOGICAL REVIEW ONLY
- Authorization: DOCUMENTED, NOT IMPLEMENTED
- File security: REQUIRES FINAL DESIGN
- API integration tests: NOT STARTED
- Final implementation approval: PENDING

The Portfolio API Contract is ready for team review,
but must not be treated as production-ready.

---

## 19. Admin Access and Dashboard API

- Project: UniGO!
- Backend Owner: Kin
- Base Path: /api/v1/admin
- Authentication: Server-side Session
- Authorization: Admin Only
- Status: DRAFT

### 19.1 Get Admin Dashboard Summary

- Method: GET
- Path: /api/v1/admin/dashboard/summary
- Authentication Required: Yes
- Required Role: admin

#### Request

- No JSON body required.
- Browser sends the session cookie.
- The backend verifies the current user's role.
- No userId or role is accepted from the client.

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Admin dashboard summary retrieved.",
      "data": {
        "activeUsers": 1280,
        "visiblePosts": 3450,
        "pendingReports": 18,
        "publicPortfolios": 420,
        "generatedAt": "2026-11-14T12:00:00Z"
      }
    }

These numbers are example values only.

#### Counting Rules

activeUsers:
- Count users where is_active = TRUE.

visiblePosts:
- Count posts where moderation_status = 'visible'.
- Exclude posts where deleted_at is not NULL.
- Exclude posts belonging to inactive users.

pendingReports:
- Count post_reports where status = 'pending'.
- This count represents the review queue.

publicPortfolios:
- Count portfolios where visibility = 'public'.
- Exclude soft-deleted portfolios.
- Exclude portfolios belonging to inactive users.

#### Validation and Security

- requireAuth must run before requireAdmin.
- Validate the authenticated session.
- Check users.is_active.
- Check the current users.role.
- Validate users.session_version.
- Never trust role values from the frontend.
- Never expose password hashes or session data.
- Use parameterized SQL queries.
- Prevent public caching of Admin responses.
- Set Cache-Control: no-store.
- Do not expose unnecessary user details.

#### Errors

- 401: Unauthenticated or invalid session
- 403: Authenticated but not authorized
- 500: Internal server error

#### Error Response Example: 403

    {
      "success": false,
      "message": "You do not have permission to access this resource.",
      "errors": [
        {
          "code": "ADMIN_ACCESS_DENIED"
        }
      ]
    }

---

### 19.2 Admin Authentication Rules

- Admin uses the normal UniGO Login API.
- A separate Admin Login is not required.
- The server creates an authenticated session.
- The session identifies the authenticated user.
- Admin authorization uses trusted server data.
- Users.role must be checked on protected requests.
- Inactive accounts cannot access Admin endpoints.
- Public registration always creates role = 'user'.
- Public registration cannot assign admin role.
- Role changes require a protected process.
- Admin access must not depend on URL secrecy.

### 19.3 Admin Middleware Design

Required middleware:
- requireAuth
- requireAdmin

#### requireAuth

Responsibilities:
- Read the authenticated server-side session.
- Reject missing or expired sessions.
- Identify the user from the session.
- Load or validate trusted account information.
- Reject inactive accounts.
- Verify session_version when enabled.

Expected failures:
- 401 Unauthorized

#### requireAdmin

Responsibilities:
- Run after requireAuth.
- Check the current trusted user role.
- Allow only role = 'admin'.
- Reject normal user accounts.
- Reject users whose privileges were revoked.
- Never trust role from request body or query data.

Expected failures:
- 403 Forbidden

#### Middleware Order

1. Session middleware
2. requireAuth
3. requireAdmin
4. Admin route handler

Security principle:
- Deny access by default.
- Check authorization on every protected request.
- Never rely only on frontend navigation controls.

### 19.4 Admin Session Security

- Use HttpOnly session cookies.
- Use Secure cookies in HTTPS production.
- Apply an appropriate SameSite policy.
- Protect state-changing requests against CSRF.
- Regenerate session identifiers after Login.
- Enforce idle and absolute session expiration.
- Revalidate active account status.
- Revalidate current Admin authorization.
- Revoke sessions after critical role changes.
- Do not log raw session cookies or session IDs.
- Never expose SESSION_SECRET.

### 19.5 Database Dependencies

Required tables:
- users
- sessions
- posts
- post_reports
- portfolios

Related tables for later Admin operations:
- admin_audit_logs

Important fields:
- users.id
- users.role
- users.is_active
- users.session_version
- posts.moderation_status
- posts.deleted_at
- post_reports.status
- portfolios.visibility
- portfolios.deleted_at

Rules:
- Use the actual approved MySQL schema.
- Do not create duplicate user tables.
- Use authorized database connections.
- Return only aggregated Dashboard data.
- Avoid returning private user information.
- Review query performance during implementation.

### 19.6 Frontend Integration Notes

Admin frontend should:
- Use the existing Login system.
- Call GET /auth/me to obtain current user context.
- Show Admin navigation only to authorized users.
- Call GET /admin/dashboard/summary.
- Include authenticated session cookies.
- Handle 401 by redirecting to Login.
- Handle 403 by showing Access Denied.
- Never trust frontend role checks as security.
- Do not store session tokens in localStorage.
- Do not expose private information in errors.

### 19.7 Future Security Test Cases

Required tests:
- Unauthenticated request returns 401.
- Normal user request returns 403.
- Active Admin request returns 200.
- Inactive Admin request is rejected.
- Expired session is rejected.
- Revoked session is rejected.
- Role change takes effect on protected requests.
- Client-supplied role cannot grant admin access.
- Direct URL access cannot bypass authorization.
- Dashboard data does not expose secrets.
- Public caches cannot retain Admin responses.

Test Status: NOT STARTED

### 19.8 Pending Decisions

- Admin account provisioning process
- Final session and CSRF configuration
- Admin frontend route structure
- Administrative permission levels
- Role change approval process
- Dashboard refresh and cache policy
- Final SQL queries and indexes
- MySQL integration testing
- Final security review

---

## 20. Admin Reports API

- Project: UniGO!
- Backend Owner: Kin
- Base Path: /api/v1/admin/reports
- Authentication Required: Yes
- Authorization: Admin Only
- Status: DRAFT

### 20.1 Get Admin Reports

- Method: GET
- Path: /api/v1/admin/reports
- Required Role: admin

#### Query Parameters

- status: optional
- limit: optional, default 20, maximum 50
- cursor: optional opaque pagination cursor

Allowed status values:
- pending
- dismissed
- action_taken

Example:
GET /api/v1/admin/reports?status=pending&limit=20

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Reports retrieved successfully.",
      "data": {
        "reports": [
          {
            "id": "701",
            "postId": "100",
            "reason": "spam",
            "status": "pending",
            "createdAt": "2026-11-14T03:30:00Z",
            "reviewedAt": null
          }
        ],
        "nextCursor": null,
        "hasMore": false
      }
    }

#### Rules

- Run requireAuth before requireAdmin.
- Reject unauthenticated requests.
- Reject non-admin requests.
- Return reports based on the requested status.
- Return all statuses when no status filter exists.
- Validate query parameters.
- Sort by created_at DESC, id DESC.
- Support stable cursor-based pagination.
- Return only necessary summary fields.
- Use parameterized SQL queries.
- Set Cache-Control: no-store.
- Do not expose report data publicly.

#### Errors

- 400: Invalid query parameters
- 401: Unauthenticated
- 403: Admin permission required
- 500: Internal server error

---

### 20.2 Get Admin Report Details

- Method: GET
- Path: /api/v1/admin/reports/:reportId
- Required Role: admin

#### Path Parameter

- reportId: valid BIGINT UNSIGNED identifier

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Report details retrieved successfully.",
      "data": {
        "report": {
          "id": "701",
          "postId": "100",
          "reporter": {
            "id": "2",
            "username": "student02"
          },
          "reason": "spam",
          "description": "Repeated advertisements.",
          "status": "pending",
          "adminNote": null,
          "reviewedBy": null,
          "reviewedAt": null,
          "createdAt": "2026-11-14T03:30:00Z"
        }
      }
    }

#### Rules

- Require an authenticated Admin session.
- Verify the current role using trusted data.
- Find the report using reportId.
- Return 404 when the report does not exist.
- Return only fields needed for moderation.
- Reporter identity is accessible only to
  authorized admins who need that information.
- Do not reveal reporter identity to post authors.
- Validate reportId before database access.
- The reported post may be hidden or deleted.
- A deleted post must not prevent viewing
  the retained report record.
- Post details require their own visibility
  and authorization checks.
- Do not include password or session data.
- Set Cache-Control: no-store.

#### Errors

- 400: Invalid reportId
- 401: Unauthenticated
- 403: Admin permission required
- 404: Report not found
- 500: Internal server error

---

### 20.3 Dismiss Admin Report

- Method: POST
- Path: /api/v1/admin/reports/:reportId/dismiss
- Required Role: admin
- Content-Type: application/json

#### Request Body

    {
      "adminNote": "No rule violation found."
    }

#### Validation Rules

- Authentication is required.
- Admin authorization is required.
- reportId must be valid.
- The report must exist.
- The report status must be pending.
- adminNote is required for accountability.
- Reject empty or whitespace-only adminNote.
- Proposed adminNote limit: 1000 characters.
- Reject unknown or protected fields.
- Do not accept reviewedBy from the client.
- Do not accept status from the client.

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Report dismissed successfully.",
      "data": {
        "report": {
          "id": "701",
          "postId": "100",
          "status": "dismissed",
          "reviewedBy": "1",
          "reviewedAt": "2026-11-14T04:00:00Z"
        }
      }
    }

#### Dismiss Rules

- Obtain the Admin ID from the session.
- Verify current Admin permissions.
- Begin a database transaction.
- Lock the report row for review.
- Confirm that status is still pending.
- Change status to dismissed.
- Set reviewed_by to the current Admin ID.
- Set reviewed_at to the current UTC time.
- Save admin_note after validation.
- Insert a related admin_audit_logs record.
- Commit only when both writes succeed.
- Roll back if either write fails.
- Do not modify post visibility.
- Do not allow regular users to dismiss reports.
- Protect the request against CSRF.

#### Audit Log

- action: report.dismiss
- target_type: report
- target_id: reportId
- actor_user_id: current Admin ID
- result: success
- request_id: server-generated request ID

#### Concurrent Review Rules

- Only one successful terminal transition
  is allowed from the pending state.
- Use row locking or a verified equivalent.
- Reject conflicting review attempts with 409.
- Do not silently overwrite earlier reviews.
- Finalized reports cannot be dismissed again.
- Do not automatically reopen finalized reports.

#### Errors

- 400: Invalid reportId or request
- 401: Unauthenticated
- 403: Admin permission required
- 404: Report not found
- 409: Report already reviewed
- 422: Validation failed
- 500: Internal server error

---

### 20.4 Report Review State Rules

Allowed statuses:
- pending
- dismissed
- action_taken

Allowed transitions in the initial version:

- pending -> dismissed
- pending -> action_taken

Disallowed transitions:

- dismissed -> pending
- action_taken -> pending
- dismissed -> action_taken
- action_taken -> dismissed

Notes:
- A finalized report is not reopened
  through the initial Admin API.
- Exceptional corrections require a separate
  audited administrative procedure.
- These transition rules must be enforced
  by the backend.
- The database stores the resulting status.

---

### 20.5 Database Dependencies

Required tables:
- users
- posts
- post_reports
- admin_audit_logs

Foreign key relationships:
- post_reports.post_id references posts.id.
- post_reports.reporter_id references users.id.
- post_reports.reviewed_by references users.id.
- admin_audit_logs.actor_user_id references users.id.

Report Constraints:
- PRIMARY KEY (id)
- UNIQUE (post_id, reporter_id)

Proposed Indexes:
- INDEX (status, created_at, id)
- INDEX (reporter_id)

Review the indexes against actual SQL queries.

### 20.6 Admin Security Rules

- Run requireAuth and requireAdmin.
- Check current account status.
- Validate session_version.
- Never trust role from request input.
- Never trust actor_user_id from the frontend.
- Do not expose reporter identity publicly.
- Restrict access to admin notes.
- Apply CSRF protection to write operations.
- Set Cache-Control: no-store.
- Use parameterized SQL queries.
- Do not store secrets in audit metadata.
- Validate all request inputs.
- Use appropriate rate limiting.

### 20.7 Admin Post Moderation Integration

- This section handles listing, viewing,
  and dismissing reports.
- Taking action on a post will be designed
  in the Admin Post Moderation API section.
- Moderation may change posts.moderation_status.
- Related pending reports may become action_taken
  according to the final moderation policy.
- Post moderation and report status changes
  must be transactionally consistent.
- Successful actions require audit records.
- Do not create conflicting report decisions.

### 20.8 Frontend Integration Notes

Admin frontend should:
- Call GET /admin/reports for the report queue.
- Support filtering by report status.
- Use pagination for large report lists.
- Call GET /admin/reports/:reportId for details.
- Show report reason and description.
- Show current review status.
- Display a Dismiss action only when pending.
- Submit adminNote when dismissing a report.
- Handle 401, 403, 404 and 409 responses.
- Send authenticated cookies.
- Include the agreed CSRF protection.
- Do not expose private report information
  in public-facing pages.

### 20.9 Required Future Tests

- Normal users cannot list Admin reports.
- Unauthenticated requests return 401.
- Normal users receive 403.
- Authorized Admins can view reports.
- Missing report returns 404.
- Invalid status filter is rejected.
- Pending report can be dismissed.
- Dismissal stores reviewed_by correctly.
- Dismissal stores reviewed_at correctly.
- Dismissal writes a successful audit log.
- A failed audit write rolls back dismissal.
- Repeated dismissal does not overwrite review.
- Concurrent review attempts cannot both win.
- Dismissal does not hide the reported post.
- Admin responses cannot be publicly cached.

Test Status: NOT STARTED

### 20.10 Pending Decisions

- Final report retention policy
- Admin permissions and access levels
- Final audit metadata policy
- Final report review workflow
- Report queue pagination indexes
- Post moderation integration
- CSRF protection implementation
- MySQL transaction testing
- Final API approval

---

## 21. Admin Post Moderation API

- Project: UniGO!
- Backend Owner: Kin
- Base Path: /api/v1/admin
- Authentication Required: Yes
- Authorization: Admin Only
- Status: DRAFT

### 21.1 Get Admin Post Details

- Method: GET
- Path: /api/v1/admin/posts/:postId
- Required Role: admin

#### Path Parameter
- postId: valid BIGINT UNSIGNED identifier.

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Admin post details retrieved successfully.",
      "data": {
        "post": {
          "id": "100",
          "userId": "2",
          "content": "Example reported post.",
          "moderationStatus": "visible",
          "deletedAt": null,
          "createdAt": "2026-11-14T03:00:00Z",
          "updatedAt": "2026-11-14T03:00:00Z"
        }
      }
    }

#### Rules
- Run requireAuth and requireAdmin.
- Verify the current Admin session.
- Check the current Admin role in trusted data.
- Validate postId before database access.
- Allow authorized review of hidden posts.
- Allow authorized review of retained soft-deleted posts.
- Return only necessary moderation information.
- Never expose passwords or session data.
- Media access must follow authorization rules.
- Set Cache-Control: no-store.
- Use parameterized SQL queries.

#### Errors
- 400: Invalid postId
- 401: Unauthenticated
- 403: Admin permission required
- 404: Post not found
- 500: Internal server error

---

### 21.2 Hide Post

- Method: POST
- Path: /api/v1/admin/posts/:postId/hide
- Required Role: admin
- Content-Type: application/json

#### Request Body

    {
      "reportId": "701",
      "adminNote": "The post violates community rules."
    }

#### Request Fields
- reportId: optional BIGINT string or null
- adminNote: required string

If reportId is null or omitted, the action is
an independent administrative moderation action.

#### Validation Rules
- Authentication is required.
- Admin authorization is required.
- postId must be valid.
- The post must exist.
- The post must not be soft-deleted.
- moderation_status must currently be visible.
- adminNote must not be empty.
- Proposed adminNote limit: 1000 characters.
- Reject unknown and protected fields.
- Do not accept adminId or role from the client.

If reportId is provided:
- The report must exist.
- The report must reference this postId.
- The report status must be pending.
- Reject mismatched or finalized reports.

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Post hidden successfully.",
      "data": {
        "post": {
          "id": "100",
          "moderationStatus": "hidden"
        },
        "report": {
          "id": "701",
          "status": "action_taken"
        }
      }
    }

When no reportId is provided:
- Return report: null.

#### Moderation Rules
- Read the Admin ID from the authenticated session.
- Validate current Admin permissions.
- Begin a database transaction.
- Lock the target post row.
- Verify the post is visible and not deleted.
- If reportId is provided, lock its report row.
- Verify the report belongs to the target post.
- Verify the report status is pending.
- Update posts.moderation_status to hidden.
- If linked, update report status to action_taken.
- If linked, set reviewed_by to the Admin ID.
- If linked, set reviewed_at to current UTC time.
- If linked, save the validated adminNote.
- Record the post.hide audit event.
- If linked, record report.action_taken audit event.
- Commit only when all database writes succeed.
- Roll back when a required write fails.

#### Other Pending Reports
- Do not automatically finalize other reports.
- Other pending reports remain pending.
- Review them individually through Admin APIs.
- Do not claim an unreviewed report was reviewed.

#### Visibility Rules
- Hide the post from public Feed responses.
- Hide the post from public Post Details.
- Hide it from hashtag search results.
- Reject new Comments and Likes.
- Do not physically delete the post.
- Preserve existing Comments and Likes.
- Preserve related Reports for review.
- Do not alter posts.deleted_at.

#### Audit Log
- action: post.hide
- target_type: post
- target_id: postId
- actor_user_id: current Admin ID
- result: success

For a linked report, also record:
- action: report.action_taken
- target_type: report
- target_id: reportId
- actor_user_id: current Admin ID
- result: success

Audit metadata must not contain secrets.

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 403: Admin permission required
- 404: Post or linked report not found
- 409: Post already hidden or deleted
- 409: Linked report already reviewed
- 422: Invalid moderation note
- 500: Internal server error

---

### 21.3 Restore Hidden Post

- Method: POST
- Path: /api/v1/admin/posts/:postId/restore
- Required Role: admin
- Content-Type: application/json

#### Request Body

    {
      "adminNote": "The moderation decision was reversed."
    }

#### Validation Rules
- Authentication is required.
- Admin authorization is required.
- postId must be valid.
- The post must exist.
- The post must currently be hidden.
- The post must not be soft-deleted.
- adminNote is required.
- Proposed adminNote limit: 1000 characters.
- Reject unknown and protected fields.

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Post restored successfully.",
      "data": {
        "post": {
          "id": "100",
          "moderationStatus": "visible"
        }
      }
    }

#### Restore Rules
- Obtain Admin identity from the session.
- Verify current Admin authorization.
- Begin a database transaction.
- Lock the target post row.
- Verify the post is hidden.
- Reject soft-deleted posts.
- Change moderation_status to visible.
- Insert the related post.restore audit record.
- Commit only when both writes succeed.
- Roll back if either operation fails.
- Do not modify posts.deleted_at.
- Do not restore author-deleted posts.
- Do not automatically reopen finalized reports.
- Keep previous audit records unchanged.
- Protect the request against CSRF.

#### Visibility After Restore
- The post may appear in the public Feed again.
- Normal account visibility rules still apply.
- Posts from inactive users remain unavailable.
- Existing comments and likes remain stored.
- Only visible, non-deleted comments are public.

#### Audit Log
- action: post.restore
- target_type: post
- target_id: postId
- actor_user_id: current Admin ID
- result: success

#### Errors
- 400: Invalid request
- 401: Unauthenticated
- 403: Admin permission required
- 404: Post not found
- 409: Post is not hidden
- 409: Post has been soft-deleted
- 422: Invalid adminNote
- 500: Internal server error

---

### 21.4 Resolve Report With Existing Action

- Method: POST
- Path: /api/v1/admin/reports/:reportId/action-taken
- Required Role: admin
- Content-Type: application/json

#### Purpose
Finalize a pending report when the related
post has already been hidden by Admin.

#### Request Body

    {
      "adminNote": "The reported post has already been hidden."
    }

#### Validation Rules
- Authentication is required.
- Admin authorization is required.
- The report must exist.
- The report must be pending.
- The linked post must exist.
- The linked post must currently be hidden.
- adminNote is required and validated.
- Reject client-supplied status or reviewedBy.

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Report review completed successfully.",
      "data": {
        "report": {
          "id": "702",
          "postId": "100",
          "status": "action_taken",
          "reviewedBy": "1",
          "reviewedAt": "2026-11-14T04:30:00Z"
        }
      }
    }

#### Review Rules
- Verify current Admin privileges.
- Begin a database transaction.
- Lock the report row and verify pending status.
- Confirm the post is already hidden.
- Set report.status to action_taken.
- Set reviewed_by to the current Admin ID.
- Set reviewed_at to current UTC time.
- Save the validated adminNote.
- Insert a report.action_taken audit record.
- Commit all related writes together.
- Roll back when a required write fails.
- Do not change the post visibility.
- Do not modify other reports.
- Reject duplicate or concurrent finalization.
- Protect the request against CSRF.

#### Errors
- 400: Invalid reportId or request
- 401: Unauthenticated
- 403: Admin permission required
- 404: Report or post not found
- 409: Report already finalized
- 409: Linked post is not hidden
- 422: Validation failed
- 500: Internal server error

---

### 21.5 Moderation State Rules

Post moderation statuses:
- visible
- hidden

Report review statuses:
- pending
- dismissed
- action_taken

Post transitions:
- visible -> hidden
- hidden -> visible

Report transitions:
- pending -> dismissed
- pending -> action_taken

Do not automatically reverse finalized reports.

### 21.6 Authentication and Authorization

- Every Admin endpoint requires authentication.
- Every Admin endpoint requires Admin authorization.
- Run requireAuth before requireAdmin.
- Verify current users.role using trusted data.
- Verify users.is_active.
- Verify users.session_version.
- Never trust Admin claims from request inputs.
- Reject unauthorized requests with 403.
- Reject unauthenticated requests with 401.
- Apply CSRF protection to write operations.
- Set Cache-Control: no-store.
- Apply appropriate rate limits.

### 21.7 Database Dependencies

Required tables:
- users
- posts
- post_reports
- admin_audit_logs

Relevant fields:
- users.id
- users.role
- users.is_active
- posts.id
- posts.user_id
- posts.moderation_status
- posts.deleted_at
- post_reports.id
- post_reports.post_id
- post_reports.status
- post_reports.reviewed_by
- post_reports.reviewed_at
- post_reports.admin_note
- admin_audit_logs.actor_user_id
- admin_audit_logs.action
- admin_audit_logs.target_type
- admin_audit_logs.target_id

Database Rules:
- Use parameterized SQL queries.
- Use transactions for moderation changes.
- Lock rows or use verified concurrency controls.
- Do not create duplicate moderation records.
- Audit important changes.
- Do not remove reports through moderation APIs.
- Confirm schema fields before SQL implementation.

### 21.8 Frontend Integration Notes

Admin frontend should:
- Use GET /admin/posts/:postId for review.
- Use POST /admin/posts/:postId/hide.
- Use POST /admin/posts/:postId/restore.
- Use POST /admin/reports/:reportId/action-taken
  for eligible pending reports.
- Require an adminNote for write operations.
- Send the session cookie.
- Include the agreed CSRF protection.
- Handle 401, 403, 404, 409 and 422 errors.
- Display the latest moderation status.
- Do not claim a report is reviewed before
  the backend confirms success.
- Never rely on hidden UI controls for security.

### 21.9 Required Future Tests

- Normal users cannot access Admin Post APIs.
- Unauthenticated requests return 401.
- Normal users receive 403.
- Admin can inspect a hidden post.
- Admin can hide a visible post.
- Hidden posts disappear from public Feed.
- Hidden posts cannot receive new comments.
- Hidden posts cannot receive new likes.
- Soft-deleted posts cannot be restored by Admin.
- Hiding a post creates an audit record.
- Linked pending report becomes action_taken.
- Other reports remain pending.
- Concurrent moderation requests are safe.
- Failed audit writes roll back moderation.
- Admin can restore a hidden post.
- Restore does not reopen finalized reports.
- A pending report for an already hidden post
  can be reviewed and marked action_taken.
- Invalid report-to-post relationships are rejected.
- Direct URLs cannot bypass authorization.

Test Status: NOT STARTED

### 21.10 Pending Decisions

- Final moderation policy
- Admin permission levels
- Moderation reason categories
- Retention of removed content
- Handling inactive author accounts
- File access for hidden posts
- CSRF implementation
- Concurrent review implementation
- Final MySQL constraints
- Final API approval

---

## 22. Admin User Management API

- Project: UniGO!
- Backend Owner: Kin
- Base Path: /api/v1/admin/users
- Authentication Required: Yes
- Authorization: Admin Only
- Status: DRAFT

### 22.1 Get Admin Users

- Method: GET
- Path: /api/v1/admin/users
- Required Role: admin

#### Query Parameters

- query: optional username search
- status: optional, active or inactive
- limit: optional, default 20, maximum 50
- cursor: optional pagination cursor

Example:
GET /api/v1/admin/users?status=active&limit=20

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Users retrieved successfully.",
      "data": {
        "users": [
          {
            "id": "2",
            "username": "student01",
            "displayName": "Example Student",
            "role": "user",
            "isActive": true,
            "createdAt": "2026-11-14T03:00:00Z"
          }
        ],
        "nextCursor": null,
        "hasMore": false
      }
    }

#### Rules

- Run requireAuth before requireAdmin.
- Validate the current Admin session.
- Verify the current trusted Admin role.
- Validate all query parameters.
- Search using approved fields.
- Use parameterized SQL queries.
- Sort by created_at DESC, id DESC.
- Support stable cursor pagination.
- Return only necessary account fields.
- Never return passwords or password hashes.
- Never return session secrets or tokens.
- Do not expose session_version.
- Set Cache-Control: no-store.

#### Errors

- 400: Invalid query parameters
- 401: Unauthenticated
- 403: Admin permission required
- 500: Internal server error

---

### 22.2 Get Admin User Details

- Method: GET
- Path: /api/v1/admin/users/:userId
- Required Role: admin

#### Path Parameter

- userId: valid BIGINT UNSIGNED identifier

#### Success Response: 200 OK

    {
      "success": true,
      "message": "User details retrieved successfully.",
      "data": {
        "user": {
          "id": "2",
          "username": "student01",
          "displayName": "Example Student",
          "role": "user",
          "isActive": true,
          "createdAt": "2026-11-14T03:00:00Z"
        }
      }
    }

#### Rules

- Authentication is required.
- Admin authorization is required.
- Verify userId is valid.
- Return 404 when user does not exist.
- Return only approved administrative fields.
- Do not expose password hashes.
- Do not expose reset tokens or session data.
- Do not expose unnecessary personal data.
- Sensitive fields require separate permission.
- Set Cache-Control: no-store.
- Use parameterized SQL queries.

#### Errors

- 400: Invalid userId
- 401: Unauthenticated
- 403: Admin permission required
- 404: User not found
- 500: Internal server error

---

### 22.3 Deactivate User

- Method: POST
- Path: /api/v1/admin/users/:userId/deactivate
- Required Role: admin
- Content-Type: application/json

#### Request Body

    {
      "reasonCode": "policy_violation",
      "adminNote": "Repeated community rule violations."
    }

#### Allowed Reason Codes

- policy_violation
- spam_abuse
- security_concern
- other

#### Validation Rules

- Authentication is required.
- Admin authorization is required.
- userId must be valid.
- The target user must exist.
- The target account must currently be active.
- The target role must be user.
- Admin cannot deactivate their own account.
- Normal Admin cannot deactivate another Admin.
- reasonCode is required and must be allowed.
- adminNote is optional, maximum 500 characters.
- Reject unknown or protected input fields.
- Do not accept isActive or role from the client.

#### Success Response: 200 OK

    {
      "success": true,
      "message": "User account deactivated successfully.",
      "data": {
        "user": {
          "id": "2",
          "username": "student01",
          "isActive": false
        }
      }
    }

#### Deactivation Rules

- Identify the Admin from the session.
- Verify current Admin permissions.
- Begin a database transaction.
- Lock the target user row.
- Confirm the target role is user.
- Confirm the account is active.
- Set users.is_active = FALSE.
- Increment users.session_version.
- Insert an admin_audit_logs record.
- Commit only when all writes succeed.
- Roll back if any required write fails.
- Do not physically delete the user.
- Do not delete posts or portfolios.
- Reject protected APIs for inactive accounts.
- Existing sessions become invalid when the
  backend checks the new session_version.
- Protect the request against CSRF.

#### Audit Log

- action: user.deactivate
- target_type: user
- target_id: target userId
- actor_user_id: current Admin ID
- result: success
- metadata: approved reason code and safe note
- request_id: server-generated request ID

Do not store secrets in audit metadata.

#### Errors

- 400: Invalid request
- 401: Unauthenticated
- 403: Admin permission required
- 403: Protected target account
- 404: User not found
- 409: Account already inactive
- 422: Invalid reason
- 500: Internal server error

---

### 22.4 Reactivate User

- Method: POST
- Path: /api/v1/admin/users/:userId/reactivate
- Required Role: admin
- Content-Type: application/json

#### Request Body

    {
      "reasonCode": "review_cleared",
      "adminNote": "Account review completed."
    }

#### Allowed Reason Codes

- review_cleared
- appeal_approved
- other

#### Validation Rules

- Authentication is required.
- Admin authorization is required.
- The target user must exist.
- The target role must be user.
- The target account must currently be inactive.
- The action must follow the agreed policy.
- reasonCode is required.
- adminNote is optional, maximum 500 characters.
- Reject protected or unknown input fields.
- Do not accept role or isActive from the client.

#### Success Response: 200 OK

    {
      "success": true,
      "message": "User account reactivated successfully.",
      "data": {
        "user": {
          "id": "2",
          "username": "student01",
          "isActive": true
        }
      }
    }

#### Reactivation Rules

- Identify the current Admin through the session.
- Verify Admin permissions.
- Begin a database transaction.
- Lock the target user row.
- Confirm the account is inactive.
- Confirm the target role is user.
- Set users.is_active = TRUE.
- Increment users.session_version again.
- Insert an admin_audit_logs record.
- Commit only when both writes succeed.
- Roll back if a required write fails.
- Old sessions must remain invalid.
- Require the user to Login again.
- Do not automatically restore deleted content.
- Do not automatically change the user's role.
- Protect the request against CSRF.

#### Audit Log

- action: user.reactivate
- target_type: user
- target_id: target userId
- actor_user_id: current Admin ID
- result: success

#### Errors

- 400: Invalid request
- 401: Unauthenticated
- 403: Admin permission required
- 403: Protected target account
- 404: User not found
- 409: Account already active
- 422: Invalid reason
- 500: Internal server error

---

### 22.5 User Account State Rules

Allowed account states:

- Active: users.is_active = TRUE
- Inactive: users.is_active = FALSE

Active -> Inactive:
- Authorized administrative deactivation.
- Revoke existing login sessions.

Inactive -> Active:
- Authorized administrative reactivation.
- Require a new Login.

User data is not physically deleted.
Account deletion requires a separate policy.

### 22.6 Role and Permission Rules

- Public registration creates role = user.
- Normal Admin cannot assign Admin roles.
- Normal Admin cannot change user roles.
- Normal Admin cannot deactivate another Admin.
- Normal Admin cannot reactivate Admin accounts.
- Admin cannot deactivate their own account.
- Role promotion requires a separate protected
  approval and provisioning process.
- Never use hidden URLs as authorization.
- Validate permissions on every Admin request.

### 22.7 Session Revocation Rules

- users.session_version is maintained by Backend.
- An authenticated session stores sessionVersion.
- Backend compares it with the database value.
- Increment the version on deactivation.
- Increment the version on reactivation.
- Reject sessions with outdated versions.
- Reject sessions belonging to inactive accounts.
- Do not restore old session validity.
- This mechanism requires real middleware.
- Session invalidation is not automatic merely
  because the database column exists.

### 22.8 Database Dependencies

Required tables:
- users
- profiles
- admin_audit_logs

Session storage:
- sessions

Important fields:
- users.id
- users.username
- users.role
- users.is_active
- users.session_version
- profiles.user_id
- admin_audit_logs.actor_user_id
- admin_audit_logs.action
- admin_audit_logs.target_type
- admin_audit_logs.target_id

Rules:
- Use parameterized SQL queries.
- Use a transaction for state changes and auditing.
- Apply appropriate row locking.
- Do not physically delete related user data.
- Validate the database schema before implementation.

### 22.9 Frontend Integration Notes

Admin frontend should:
- Use GET /admin/users for searching accounts.
- Use GET /admin/users/:userId for details.
- Use POST /admin/users/:userId/deactivate.
- Use POST /admin/users/:userId/reactivate.
- Show the current account status.
- Request a reason before changing status.
- Display confirmation before deactivation.
- Hide protected actions for Admin accounts.
- Handle 401, 403, 404, 409 and 422.
- Send authenticated cookies.
- Include the agreed CSRF protection.
- Never rely only on frontend role checks.
- Refresh user data after successful updates.

### 22.10 Future Security Tests

- Unauthenticated request returns 401.
- Normal user receives 403.
- Admin can list permitted user accounts.
- Admin can inspect an account.
- Admin can deactivate an active user.
- Admin cannot deactivate their own account.
- Admin cannot deactivate another Admin.
- Normal user cannot change account status.
- Client-supplied role is rejected.
- A deactivated user cannot access protected APIs.
- Existing sessions become invalid.
- Reactivation requires authorized Admin access.
- Reactivated user must Login again.
- A failed audit write rolls back the state change.
- Concurrent status changes are handled safely.
- No passwords or secrets are exposed.
- Inactive user content follows visibility policy.

Test Status: NOT STARTED

### 22.11 Pending Decisions

- Final Admin account provisioning policy
- Account deactivation and appeal workflow
- Role escalation approval process
- Admin permission levels
- Whether users receive status notifications
- Final audit retention rules
- Session cleanup strategy
- CSRF protection implementation
- Privacy and account erasure policies
- Final API approval

---

## 23. Admin Audit Logs API

- Project: UniGO!
- Backend Owner: Kin
- Base Path: /api/v1/admin/audit-logs
- Authentication Required: Yes
- Authorization: Admin Only
- Status: DRAFT

### 23.1 Get Admin Audit Logs

- Method: GET
- Path: /api/v1/admin/audit-logs
- Required Role: admin

#### Query Parameters

- actorUserId: optional BIGINT string
- action: optional action name
- targetType: optional target type
- result: optional, success or failed
- startDate: optional ISO 8601 UTC timestamp
- endDate: optional ISO 8601 UTC timestamp
- limit: optional, default 20, maximum 50
- cursor: optional opaque pagination cursor

Example:
GET /api/v1/admin/audit-logs?limit=20

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Audit logs retrieved successfully.",
      "data": {
        "logs": [
          {
            "id": "9001",
            "actor": {
              "id": "1",
              "username": "admin01"
            },
            "action": "post.hide",
            "targetType": "post",
            "targetId": "100",
            "result": "success",
            "createdAt": "2026-11-14T05:30:00Z"
          }
        ],
        "nextCursor": null,
        "hasMore": false
      }
    }

#### Authentication Rules

- Run requireAuth before requireAdmin.
- Verify the current authenticated session.
- Check users.is_active.
- Verify current users.role.
- Check session_version when enabled.
- Reject unauthenticated requests with 401.
- Reject unauthorized requests with 403.
- Never trust role from the frontend.

#### Filtering Rules

- Validate all query parameters.
- Validate actorUserId as a BIGINT identifier.
- Validate action against supported action names.
- Validate targetType against supported values.
- Validate result against supported values.
- Validate date ranges.
- startDate must not be after endDate.
- Apply an agreed maximum query date range.
- Proposed maximum date range: 90 days.
- Treat the pagination cursor as opaque.
- Reject malformed cursors.
- Use parameterized SQL queries.

#### Pagination Rules

- Default limit: 20.
- Maximum limit: 50.
- Sort by created_at DESC, id DESC.
- Use stable cursor-based pagination.
- Generate nextCursor on the server.
- Apply filters consistently across pages.
- Do not return unlimited audit records.

#### Privacy Rules

- Return only approved audit summary fields.
- Do not expose raw session identifiers.
- Do not expose passwords or reset tokens.
- Do not expose internal storage credentials.
- Do not expose unsanitized metadata.
- Restrict audit access to authorized admins.
- Set Cache-Control: no-store.
- Apply suitable request rate limits.

#### Errors

- 400: Invalid query parameters
- 401: Unauthenticated
- 403: Audit access denied
- 429: Too many requests
- 500: Internal server error

---

### 23.2 Get Admin Audit Log Details

- Method: GET
- Path: /api/v1/admin/audit-logs/:auditLogId
- Required Role: admin

#### Path Parameter

- auditLogId: valid BIGINT UNSIGNED identifier

#### Success Response: 200 OK

    {
      "success": true,
      "message": "Audit log retrieved successfully.",
      "data": {
        "log": {
          "id": "9001",
          "actor": {
            "id": "1",
            "username": "admin01"
          },
          "action": "post.hide",
          "targetType": "post",
          "targetId": "100",
          "result": "success",
          "metadata": {
            "reasonCode": "policy_violation"
          },
          "requestId": "req-example-9001",
          "createdAt": "2026-11-14T05:30:00Z"
        }
      }
    }

#### Validation Rules

- Authentication is required.
- Admin authorization is required.
- auditLogId must be valid.
- Audit log must exist.
- Reject invalid identifiers.
- Return 404 for nonexistent records.
- Verify permission before accessing log data.

#### Detail Rules

- Read the log using its primary key.
- Include only necessary investigation fields.
- Resolve actor username from users if available.
- Never modify the original audit record.
- Return approved and sanitized metadata.
- Do not expose sensitive internal data.
- Preserve the stored event timestamp.
- Use parameterized SQL queries.
- Set Cache-Control: no-store.

#### Errors

- 400: Invalid auditLogId
- 401: Unauthenticated
- 403: Audit access denied
- 404: Audit log not found
- 500: Internal server error

---

### 23.3 Audit Log Creation Rules

Audit records are generated by trusted backend code.

Supported action examples:
- post.hide
- post.restore
- report.dismiss
- report.action_taken
- user.deactivate
- user.reactivate

Additional actions require an approved action policy.

#### Successful Administrative Operations

- Authenticate and authorize the Admin.
- Validate the requested action.
- Start a database transaction.
- Perform the protected database change.
- Insert the corresponding audit record.
- Use the same transaction for related writes.
- Commit only when required writes succeed.
- Roll back when a required write fails.

#### Audit Record Data

- actor_user_id comes from trusted authentication.
- action is assigned by backend code.
- target_type identifies the affected entity.
- target_id identifies the affected record.
- result records the event outcome.
- metadata contains approved safe context only.
- request_id is generated or propagated by backend.
- created_at is generated by the database.

#### Failed Operations

- Failed attempts may be tracked separately.
- Do not depend on an audit INSERT inside
  a transaction that will be rolled back.
- Use separate security-event logging when needed.
- Never claim a failed operation succeeded.

---

### 23.4 Audit Log Immutability

- Audit logs are append-only through application APIs.
- Do not create public audit log write endpoints.
- Do not create normal Admin update endpoints.
- Do not create normal Admin delete endpoints.
- Existing audit records must not be overwritten.
- Limit database privileges where possible.
- Separate log read and write privileges if feasible.
- Database administrators may still have
  privileged access to stored audit records.
- Application-level append-only is not
  equivalent to tamper-proof storage.

### 23.5 Metadata Security

- Metadata must contain only necessary context.
- Validate and sanitize metadata before insertion.
- Never store plaintext passwords.
- Never store password hashes.
- Never store raw session IDs or cookies.
- Never store password reset tokens.
- Never store API keys or SESSION_SECRET.
- Do not store unnecessary personal information.
- Prevent unsafe user input from being used
  directly as trusted log metadata.
- Avoid unrestricted metadata size.

### 23.6 Audit Log Access Control

Initial access policy:
- Authentication is required.
- The account must be active.
- The current role must be admin.
- Regular users cannot access audit logs.

Preferred future permission:
- audit_logs.read

Notes:
- A separate audit-read permission would allow
  more restrictive access than the admin role alone.
- The current users.role design does not yet
  implement fine-grained permissions.
- Final access policy requires security approval.
- Log-reading access may itself be monitored
  through separate security telemetry.

### 23.7 Database Dependencies

Required tables:
- admin_audit_logs
- users

Relationships:
- admin_audit_logs.actor_user_id references users.id.

Columns:
- id
- actor_user_id
- action
- target_type
- target_id
- result
- metadata
- request_id
- created_at

Proposed indexes:
- PRIMARY KEY (id)
- INDEX (actor_user_id, created_at)
- INDEX (action, created_at)
- INDEX (target_type, target_id, created_at)
- INDEX (created_at)

Review a possible (created_at, id) index
for stable pagination using actual SQL queries.

Database rules:
- Preserve original audit information.
- Use parameterized SQL queries.
- Apply least-privilege database access.
- Final retention and deletion policy is pending.

### 23.8 Frontend Integration Notes

Admin frontend should:
- Call GET /admin/audit-logs for history.
- Support action and result filters.
- Support filtering by Admin and date.
- Use pagination for large record sets.
- Call GET /admin/audit-logs/:auditLogId
  for individual event details.
- Display the actor, action, target and time.
- Show only authorized metadata.
- Do not provide edit or delete buttons.
- Handle 400, 401, 403, 404 and 429 errors.
- Send authenticated session cookies.
- Do not cache sensitive records publicly.
- Do not treat hidden UI controls as security.

### 23.9 Required Future Security Tests

- Unauthenticated requests return 401.
- Normal users receive 403.
- Authorized Admins can list audit records.
- Authorized Admins can view record details.
- Missing log returns 404.
- Invalid filters are rejected.
- Date range validation works.
- Pagination returns stable results.
- Log detail does not expose secrets.
- Metadata is properly sanitized.
- Existing audit records cannot be edited via API.
- Existing audit records cannot be deleted via API.
- Failed Admin transactions do not create
  false successful audit entries.
- Successful protected changes create audit logs.
- Unauthorized requests cannot bypass middleware.
- Admin responses are not publicly cached.

Test Status: NOT STARTED

### 23.10 Pending Decisions

- Final audit retention period
- Fine-grained audit-read permissions
- Final audit action vocabulary
- Allowed metadata schema per action
- Security event logging for failed attempts
- Database privilege separation
- Pagination index optimization
- Audit monitoring and alert policy
- Final MySQL implementation
- Final security approval

---

## 24. Final Admin API and Security Review

- Project: UniGO!
- Backend Owner: Kin
- Status: DRAFT SECURITY REVIEW
- Implementation: NOT STARTED
- Security Testing: NOT STARTED

### 24.1 Admin Endpoint Coverage

Admin Dashboard - Section 19:
- 1 endpoint

Admin Reports - Section 20:
- 3 endpoints

Admin Post Moderation - Section 21:
- 4 endpoints

Admin User Management - Section 22:
- 4 endpoints

Admin Audit Logs - Section 23:
- 2 endpoints

Total Admin Endpoints: 14
Total Project Endpoints: 63

### 24.2 Authentication Review

Every protected Admin API must:
- Use the server-side session.
- Run requireAuth.
- Reject missing sessions.
- Reject expired sessions.
- Verify the current account exists.
- Check users.is_active.
- Validate users.session_version.
- Reject revoked sessions.
- Never trust identity from request input.

Expected behavior:
- Unauthenticated: 401
- Invalid session: 401
- Valid authorized Admin: Continue

### 24.3 Authorization Review

Every Admin API must:
- Run requireAdmin after requireAuth.
- Use the current trusted users.role.
- Permit only authorized administrators.
- Reject normal users.
- Reject inactive administrators.
- Reject revoked administrative privileges.
- Never trust client-supplied role values.
- Never rely on hidden Admin URLs.
- Follow deny-by-default authorization.

Expected behavior:
- Authenticated normal user: 403
- Authorized Admin: Continue

### 24.4 Session Security Review

- Session cookies must be HttpOnly.
- Secure must be enabled in HTTPS production.
- SameSite policy must be configured.
- State-changing operations need CSRF protection.
- Regenerate session IDs after Login.
- Apply idle session expiration.
- Apply absolute session expiration.
- Never expose SESSION_SECRET.
- Never log session cookies.
- Session stores must be production appropriate.

Session revocation:
- Increment session_version on deactivation.
- Increment session_version on reactivation.
- Check the version on protected requests.
- Require Login after reactivation.
- Revoke sessions after critical role changes.

### 24.5 Report and Moderation Consistency

Report states:
- pending
- dismissed
- action_taken

Allowed transitions:
- pending -> dismissed
- pending -> action_taken

Post moderation states:
- visible
- hidden

Allowed transitions:
- visible -> hidden
- hidden -> visible

Consistency rules:
- A report starts in pending.
- Regular users cannot change report status.
- Only authorized Admin APIs finalize reports.
- Finalized reports cannot be overwritten normally.
- Hiding a post does not automatically finalize
  every related pending report.
- A linked pending report may become action_taken.
- Other reports must be reviewed according
  to the approved moderation workflow.
- Restoring a post does not reopen old reports.
- Soft-deleted posts cannot be restored through
  the Admin moderation restore endpoint.

### 24.6 Database Transaction Review

Critical operations:
- Dismiss Report
- Hide Post
- Restore Post
- Mark Report Action Taken
- Deactivate User
- Reactivate User

Each operation must:
- Verify authorization before modification.
- Validate current record state.
- Begin a database transaction.
- Lock affected rows where required.
- Use a consistent lock acquisition order.
- Perform the authorized data change.
- Insert the corresponding audit record.
- Commit only when required writes succeed.
- Roll back on failure.
- Handle concurrent requests safely.

Additional requirements:
- Avoid duplicate state transitions.
- Return 409 for relevant state conflicts.
- Do not silently overwrite another Admin decision.
- Use parameterized SQL queries.
- Test deadlock and retry behavior where appropriate.

### 24.7 Admin Audit Log Review

Audit records must:
- Identify the actor.
- Identify the action.
- Identify the target.
- Record the event time.
- Record approved safe metadata.
- Record a trusted result.
- Preserve accountability.

Security rules:
- No public audit log API.
- No normal Admin audit update API.
- No normal Admin audit delete API.
- Restrict read access.
- Use least-privilege database permissions.
- Never store credentials or session secrets.
- Sanitize metadata.
- Preserve successful event history.
- Handle failed-operation security logging separately.

Application-level append-only logs are not
automatically tamper-proof.

### 24.8 Admin User Management Review

- Only authorized Admins can change account state.
- Normal Admins cannot deactivate themselves.
- Normal Admins cannot deactivate other Admins.
- Public registration cannot create Admin accounts.
- Role escalation requires a protected procedure.
- Deactivation does not physically delete user data.
- Deactivation revokes existing sessions.
- Reactivation requires a new Login.
- Account status changes require audit records.
- Account deletion requires a separate policy.

### 24.9 Privacy and Response Security

- Admin APIs return only necessary data.
- Protect reporter identities.
- Protect personal account information.
- Never return password_hash.
- Never return session secrets.
- Never expose raw reset tokens.
- Use Cache-Control: no-store.
- Avoid sensitive information in error messages.
- Use standard JSON response structures.
- Serialize BIGINT identifiers as strings.
- Use ISO 8601 UTC timestamps.

### 24.10 Required Security Test Matrix

Authentication:
- [ ] Missing session returns 401.
- [ ] Expired session returns 401.
- [ ] Revoked session is rejected.
- [ ] Inactive Admin is rejected.

Authorization:
- [ ] Normal user receives 403.
- [ ] Direct URL access cannot bypass permissions.
- [ ] Client-supplied role is ignored.
- [ ] Role revocation takes effect.

Reports:
- [ ] Admin can review a pending report.
- [ ] Duplicate review is rejected.
- [ ] Concurrent review attempts are safe.
- [ ] Finalized reports are protected.

Post Moderation:
- [ ] Admin can hide a visible post.
- [ ] Hidden posts disappear publicly.
- [ ] Admin can restore an eligible hidden post.
- [ ] Soft-deleted posts cannot be restored here.
- [ ] Moderation changes create audit logs.

User Management:
- [ ] Admin can deactivate a normal user.
- [ ] Deactivated user loses protected access.
- [ ] Admin cannot deactivate themselves.
- [ ] Admin cannot deactivate another Admin.
- [ ] Reactivated users must Login again.

Audit Logs:
- [ ] Authorized Admin can read audit records.
- [ ] Normal users cannot read audit records.
- [ ] Audit metadata contains no secrets.
- [ ] Audit write failure rolls back protected changes.
- [ ] Audit records cannot be edited through APIs.

Additional Security:
- [ ] CSRF protection works.
- [ ] SQL injection attempts are rejected.
- [ ] Invalid input is rejected.
- [ ] Admin responses are not publicly cached.
- [ ] Rate limiting is enforced where needed.

Test execution status: NOT STARTED

### 24.11 Database Compatibility Checks

Before SQL implementation:
- Confirm users.role values.
- Confirm users.is_active.
- Confirm users.session_version.
- Confirm posts.moderation_status values.
- Confirm post_reports.status values.
- Confirm admin_audit_logs columns and constraints.
- Confirm audit action and result values.
- Confirm the session store schema.
- Confirm foreign key behavior.
- Confirm all related transactions use InnoDB.
- Confirm the actual MySQL server version.

These checks require the real database schema
and must not be marked complete yet.

### 24.12 Pending Security Decisions

- Final Admin provisioning workflow
- Role escalation and permission policy
- CSRF protection mechanism
- Session expiration policy
- Cookie and CORS configuration
- Audit retention and privacy policy
- Failed-operation security logging
- Moderator conflict handling
- Final MySQL constraints and indexes
- Team review and approval

### 24.13 Review Conclusion

- Admin Endpoint Documentation: DRAFT COMPLETE
- Admin Endpoint Count: PENDING LOCAL CHECK
- Authentication Design: DOCUMENTED
- Authorization Design: DOCUMENTED
- Audit Logging Design: DOCUMENTED
- Concurrency Design: REQUIRES IMPLEMENTATION
- SQL Compatibility: NOT TESTED
- Security Tests: NOT STARTED
- Frontend Integration: NOT STARTED
- Production Approval: PENDING

The Admin API design is ready for final
team and implementation review.

This document does not certify that the
Admin APIs are implemented or secure.
