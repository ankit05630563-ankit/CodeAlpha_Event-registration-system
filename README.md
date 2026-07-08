# Event Registration System

A backend API built with **Express.js** and **MongoDB (Mongoose)** for managing events and user registrations. Users can sign up, browse events, register for events, and view/cancel their own registrations.

## Features

- JWT-based authentication (register/login)
- Event CRUD (list, details, create/update/delete for admins)
- Registration system linking users to events
- Users can view and cancel their own registrations
- Capacity tracking — prevents registering for a full event
- Centralized error handling

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JSON Web Tokens (jsonwebtoken)
- bcryptjs for password hashing

## Project Structure

```
event-registration-system/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # register/login/me
│   ├── eventController.js     # event CRUD
│   └── registrationController.js # registration logic
├── middleware/
│   ├── auth.js                # JWT protect + role authorize
│   └── errorHandler.js        # 404 + generic error handler
├── models/
│   ├── User.js
│   ├── Event.js
│   └── Registration.js
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   └── registrationRoutes.js
├── utils/
│   └── generateToken.js
├── server.js                  # app entry point
├── package.json
└── .env.example
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   ```
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/event_registration
   JWT_SECRET=replace_this_with_a_long_random_secret
   JWT_EXPIRES_IN=7d
   ```
   For MongoDB Atlas, set `MONGO_URI` to your Atlas connection string instead.

3. **Run the server**
   ```bash
   npm start        # production
   npm run dev       # development, with nodemon auto-reload
   ```

   The API will be running at `http://localhost:5000`.

## API Reference

All request/response bodies are JSON. Protected routes require a header:
```
Authorization: Bearer <token>
```

### Auth

| Method | Route              | Access  | Description                  |
|--------|---------------------|---------|-------------------------------|
| POST   | `/api/auth/register` | Public  | Create an account, returns token |
| POST   | `/api/auth/login`    | Public  | Log in, returns token         |
| GET    | `/api/auth/me`        | Private | Get current user's profile    |

**Register example**
```json
POST /api/auth/register
{
  "name": "Alia Rahman",
  "email": "alia@example.com",
  "password": "secret123"
}
```

### Events

| Method | Route             | Access        | Description                     |
|--------|--------------------|---------------|-----------------------------------|
| GET    | `/api/events`        | Public        | List events (supports `?search=`, `?page=`, `?limit=`) |
| GET    | `/api/events/:id`     | Public        | Get single event details        |
| POST   | `/api/events`         | Admin only    | Create a new event               |
| PUT    | `/api/events/:id`     | Admin only    | Update an event                  |
| DELETE | `/api/events/:id`     | Admin only    | Delete an event                  |

**Create event example**
```json
POST /api/events
Authorization: Bearer <admin_token>
{
  "title": "Tech Conference 2026",
  "description": "Annual developer conference",
  "date": "2026-09-15T09:00:00.000Z",
  "location": "Varanasi Convention Center",
  "capacity": 200
}
```

> Note: the first registered user must be manually promoted to `role: "admin"` in the database (or you can add a seed script) since public registration always creates standard `user` accounts by design.

### Registrations

| Method | Route                     | Access  | Description                              |
|--------|----------------------------|---------|--------------------------------------------|
| POST   | `/api/registrations`         | Private | Register the logged-in user for an event (`{ "eventId": "..." }`) |
| GET    | `/api/registrations/my`       | Private | List the logged-in user's registrations (optional `?status=confirmed\|cancelled`) |
| GET    | `/api/registrations/:id`      | Private | Get a single registration (must belong to user, or be admin) |
| DELETE | `/api/registrations/:id`      | Private | Cancel a registration (must belong to user, or be admin) |

**Register for an event example**
```json
POST /api/registrations
Authorization: Bearer <user_token>
{
  "eventId": "64f0c1c2b7e2a5a1b8f9e123"
}
```

## How Linking Works

- Every `Registration` document stores a reference to both a `User` (`user`) and an `Event` (`event`).
- When a user registers, the event's `registeredCount` is incremented; when they cancel, it's decremented.
- A unique partial index ensures a user can't hold two *active* (`confirmed`) registrations for the same event, while still allowing them to re-register after cancelling.
- `GET /api/registrations/my` returns all registrations for the authenticated user with event details populated, so the frontend can build a "My Registrations" page directly from this endpoint.

## Notes on Extending This

- Add a `PATCH /api/registrations/:id/reactivate` if you want cancelled users to re-register with one click instead of calling `POST /api/registrations` again (current code already supports reactivation transparently).
- Add pagination to `/api/registrations/my` if a user could have very many registrations.
- Add email confirmation using a service like Nodemailer on successful registration.
- Consider rate-limiting `/api/auth/login` against brute force.
