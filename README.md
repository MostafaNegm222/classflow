# ClassFlow

## 1. Description

A lightweight classroom platform for instructors and trainees, built to put class content, quizzes and progress tracking in one place. Instructors manage quizzes with automatic grading; trainees take published quizzes and get their score instantly.

**Status:** In active development. The API, Docker setup and quizzes are working; the frontend (`client/`) has not been started yet.

## 2. Technologies and Versions

- **Backend (`server/`)**: Node.js with Express ^4.19.2, MongoDB with Mongoose ^8.5.1, JWT ^9.0.2 (auth), bcryptjs ^2.4.3, google-auth-library ^9.11.0 (Google sign-in), Nodemailer ^6.9.14 (password-reset emails), dotenv ^16.4.5, cors ^2.8.5
- **DevOps**: Docker and docker compose for the API + MongoDB
- **Tests**: Jest ^30.5.2, nodemon ^3.1.4 (dev)
- **Frontend (`client/`)**: placeholder folder; the client has not been built yet

## 3. Requirements and Dependencies

- Docker (for the easiest run), or Node.js 20+ and MongoDB for a local run
- Server dependencies are installed with `npm install` inside `server/` (see `server/package.json`)

## 4. Installation and Run Steps

**With Docker (easiest)**

```bash
git clone https://github.com/MostafaNegm222/classflow.git
cd classflow
docker compose up --build
```

- API health check: http://localhost:5000/api/health
- Stop: Ctrl+C, then `docker compose down` (add `-v` to also delete the database data)

**Locally (without Docker)**

```bash
cd server
npm install
cp .env.example .env   # then fill in the values (see section 5)
npm run dev
```

## 5. Environment Variables

Server `.env` (listed in `server/.env.example` with example values; no secrets are stored in the repo):

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (5000) |
| `MONGO_URI` | MongoDB connection string (`mongodb://mongo:27017/classflow` inside compose) |
| `JWT_SECRET` | Secret used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. 7d) |
| `GOOGLE_CLIENT_ID` | Google sign-in (OAuth 2.0 Web Client ID) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Password-reset emails |
| `CLIENT_URL` | Where password-reset links point (the client app) |

## 6. Usage and Main Features

- **Auth**: email/password signup and login, Google sign-in, forgot/reset password by email, JWT-based sessions with instructor and trainee roles.
- **Instructor profiles**: list and search instructors, and view each instructor's public profile.
- **Quizzes**: instructors create, publish, edit and delete quizzes with objective questions; visitors see published quizzes without the answers; logged-in users submit their answers and get automatic grading with their score.
- Server code follows a layered structure: routes -> controllers -> services -> Mongoose models, with a shared API features helper (filter/search/sort/pagination) and central error handling.

Still planned: assignments and trainee submissions, progress dashboards, and the frontend client.

## 7. Screenshots / Demo

No live demo yet; the API runs locally or in Docker.

## 8. Running Tests

```bash
cd server
npm test
```

Jest suites cover the auth and quiz flows (see `server/tests/`).
