
# Redis Catching Implementation in backend crud with Authentication & Authorization API

A backend authentication and authorization system built using **Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, and JWT**.

The project implements secure user registration, login, JWT-based authentication, Role-Based Access Control (RBAC), permission checks, and resource ownership validation.

## Features

- User registration and login
- Password hashing using bcrypt
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Permission-based authorization
- Resource ownership validation
- Protected API routes
- PostgreSQL database integration using Prisma ORM
- TypeScript type augmentation for Express Request
- Centralized middleware architecture

## Tech Stack

| Technology | Purpose             |
| ---------- | ------------------- |
| Node.js    | JavaScript runtime  |
| Express.js | Backend framework   |
| TypeScript | Type safety         |
| PostgreSQL | Relational database |
| Prisma ORM | Database access     |
| JWT        | Authentication      |
| bcryptjs   | Password hashing    |

## Project Structure

```text
src/
├── config/
│   └── prisma.ts
├── controllers/
│   ├── auth.controller.ts
│   └── post.controller.ts
├── middlewares/
│   ├── authenticate.ts
│   ├── authorize.ts
│   └── checkOwnership.ts
├── routes/
│   ├── auth.routes.ts
│   └── post.routes.ts
├── types/
│   └── express.d.ts
├── app.ts
└── server.ts

prisma/
└── schema.prisma

generated/
└── prisma/

.env
package.json
tsconfig.json
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/sohail4291/redis_catching
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rbac_demo"
JWT_SECRET="your-long-random-secret"
PORT=3000
```

Replace the database credentials with your PostgreSQL configuration.

### 4. Generate Prisma Client and run migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the development server

```bash
npm run dev
```

Server runs at:

```text
http://localhost:3000
```

## Database Models

### User

| Field     | Type     | Description        |
| --------- | -------- | ------------------ |
| id        | Int      | Primary key        |
| name      | String   | User name          |
| email     | String   | Unique email       |
| password  | String   | Hashed password    |
| role      | Role     | User role          |
| createdAt | DateTime | Creation timestamp |

### Post

| Field     | Type     | Description           |
| --------- | -------- | --------------------- |
| id        | Int      | Primary key           |
| title     | String   | Post title            |
| content   | String   | Post content          |
| authorId  | Int      | Post owner's user ID  |
| createdAt | DateTime | Creation timestamp    |
| updatedAt | DateTime | Last update timestamp |

Relationship: One User can create multiple Posts. Each Post belongs to one User.

## Authentication

Authentication determines who is making the request.

### Signup

**POST** `/api/auth/signup`

Request:

```json
{
  "name": "Sohail",
  "email": "sohail@gmail.com",
  "password": "Password@123"
}
```

The password is hashed using bcrypt before being stored in PostgreSQL.

A JWT access token is returned after successful registration.

### Login

**POST** `/api/auth/login`

Request:

```json
{
  "email": "sohail@gmail.com",
  "password": "Password@123"
}
```

The server verifies the password and generates a JWT access token.

### JWT Authentication

Protected routes require the following header:

```http
Authorization: Bearer <access_token>
```

The authentication middleware:

1. Extracts the JWT from the Authorization header.
2. Verifies the token signature and expiration.
3. Extracts the user's ID and role.
4. Attaches the authenticated user to `req.user`.
5. Passes control to the next middleware.

## Authorization (RBAC)

Authorization determines what an authenticated user is allowed to do.

The project uses three roles:

| Permission         | Admin | Editor |   User   |
| ------------------ | :---: | :----: | :-------: |
| Create post        |  Yes  |  Yes  |    Yes    |
| Read posts         |  Yes  |  Yes  |    Yes    |
| Update posts       |  Yes  |  Yes  | Own posts |
| Delete posts       |  Yes  |   No   | Own posts |
| Manage users       |  Yes  |   No   |    No    |
| Access admin route |  Yes  |   No   |    No    |

The authorization middleware supports:

**Role-based authorization**

```ts
requireRole("admin");
```

**Permission-based authorization**

```ts
requirePermission("post:create");
```

Permissions are defined centrally in the authorization middleware.

## Resource Ownership

Ownership validation ensures that users can only modify resources they own unless they have an elevated role.

Example:

```ts
checkPostOwnership("editor", "admin");
```

This allows:

- The post owner to update their post.
- Editors to update any post.
- Admins to update any post.

For deletion:

```ts
checkPostOwnership("admin");
```

This allows:

- The post owner to delete their post.
- Admins to delete any post.
- Editors cannot delete posts.

The ownership middleware fetches the post from PostgreSQL, checks its `authorId`, and attaches the post to `req.post`.

## API Endpoints

Base URL: `http://localhost:3000`

### Authentication APIs

| Method | Endpoint             | Authentication |
| ------ | -------------------- | -------------- |
| POST   | `/api/auth/signup` | No             |
| POST   | `/api/auth/login`  | No             |

### Post APIs

| Method | Endpoint             | Description         | Authentication   |
| ------ | -------------------- | ------------------- | ---------------- |
| POST   | `/api/posts`       | Create a post       | Required         |
| GET    | `/api/posts`       | Get all posts       | Required         |
| PUT    | `/api/posts/:id`   | Update a post       | Required         |
| DELETE | `/api/posts/:id`   | Delete a post       | Required         |
| GET    | `/api/posts/admin` | Admin-only endpoint | Required + Admin |

### Create Post

**POST** `/api/posts`

```json
{
  "title": "Learning Node.js",
  "content": "Understanding authentication and authorization"
}
```

The authenticated user's ID is automatically assigned as the post's `authorId`.

### Update Post

**PUT** `/api/posts/1`

```json
{
  "title": "Updated Node.js",
  "content": "Learning production-grade backend development"
}
```

### Delete Post

**DELETE** `/api/posts/1`

No request body required.

## Middleware Execution Flow

For a protected update request:

```text
Client Request
      |
      v
Authentication Middleware
      |
      v
Authorization / Ownership Middleware
      |
      v
Post Controller
      |
      v
PostgreSQL Database
      |
      v
Response
```

### HTTP Status Codes

| Status | Meaning               |
| ------ | --------------------- |
| 200    | Request successful    |
| 201    | Resource created      |
| 400    | Invalid request       |
| 401    | Unauthorized          |
| 403    | Forbidden             |
| 404    | Resource not found    |
| 409    | Resource conflict     |
| 500    | Internal server error |

## Testing

Use Postman to test the APIs.

1. Register users with different accounts.
2. Log in and copy each user's access token.
3. Assign editor and admin roles directly in PostgreSQL for testing.
4. Add the appropriate Bearer token to protected requests.
5. Create posts using different accounts.
6. Test post ownership by updating and deleting posts belonging to other users.
7. Test admin-only routes using different roles.

Example SQL to update roles:

```sql
UPDATE "User"
SET role = 'editor'
WHERE email = 'rahul@gmail.com';

UPDATE "User"
SET role = 'admin'
WHERE email = 'admin@gmail.com';
```

## Security Considerations

- Passwords are stored as bcrypt hashes, never as plain text.
- JWT secrets are stored in environment variables.
- JWT signature and expiration are verified.
- Public signup does not allow users to assign themselves elevated roles.
- Protected routes require authentication.
- Ownership checks prevent unauthorized resource modification.
- Database queries use Prisma's parameterized query handling.

For production deployment, add request validation, login rate limiting, refresh-token rotation, centralized error handling, secure secret management, and audit logging.

## Future Improvements

- Refresh token rotation and logout
- Email verification
- Password reset
- Account lockout and rate limiting
- Zod request validation
- Pagination and filtering
- Redis caching
- Automated unit and integration tests
- Docker and CI/CD deployment

## Learning Outcomes

Through this project, the following backend concepts are implemented:

- Authentication vs Authorization
- JWT-based authentication
- Password hashing
- Express middleware
- TypeScript declaration merging
- Role-Based Access Control (RBAC)
- Permission-based authorization
- Resource ownership and access control
- Relational database relationships
- Prisma ORM integration

---

**Author:** Sohail
**Tech Stack:** Node.js | Express.js | TypeScript | PostgreSQL | Prisma | JWT
