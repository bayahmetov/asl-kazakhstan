# Educational Platform Backend

Node.js + Express + TypeScript + PostgreSQL backend for video courses.

## Features

- User registration, login, JWT-based authentication
- Role-based access (admin, instructor, student)
- Video course management (create, list)
- Video lesson upload (Multer, local storage or S3)
- Modular code: routes, controllers, services, models, middleware
- Secure password hashing (bcrypt)
- Token verification

## Getting Started (Windows 11)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   - Copy `.env.example` to `.env` and fill in:
     ```
     DATABASE_URL=postgresql://user:password@localhost:5432/yourdb
     JWT_SECRET=your_jwt_secret
     ```

3. **Setup PostgreSQL:**
   - Install [PostgreSQL](https://www.postgresql.org/download/windows/)
   - Create a database (e.g. `yourdb`)

4. **Prepare Prisma:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Run locally:**
   ```bash
   npm run dev
   ```
   - Server runs at `http://localhost:5000`

6. **Test endpoints:**
   - Use Postman or curl to test `/api/auth/register`, `/api/auth/login`, etc.

## Deployment (Vercel, Railway, Render)

- Deploy with your preferred provider (Node.js environment required).
- **Environment variables:** Set up `DATABASE_URL` and `JWT_SECRET` on the platform.
- **Storage:** For production, consider S3 for video storage. Replace `upload.middleware.ts` to use `multer-s3`.
- **Prisma:** Use `npx prisma migrate deploy` on the server.
- **Start server:** Use `npm run start` or set up a Procfile for Heroku/Render.

## Folder Structure

```
src/
  controllers/
  middleware/
  models/
  routes/
  app.ts
  server.ts
prisma/
  schema.prisma
uploads/                  # Local video uploads (for dev only)
.env
README.md
```

## Security Notes

- Passwords are never stored in plain text.
- All JWTs must be sent as `Authorization: Bearer <token>`.
- Role-based access enforced via middleware.

## Extending

- Add more endpoints, e.g. course enrollment, progress tracking.
- Add S3 support by updating `upload.middleware.ts`.
