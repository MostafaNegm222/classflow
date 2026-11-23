# ClassFlow

A lightweight classroom platform for instructors and trainees: quizzes, assignments, submissions, and progress tracking in one place.

Built with the MERN stack (MongoDB, Express.js, React, Node.js).

**Status:** In active development.

## Features (MVP)

- Instructor and trainee accounts with JWT authentication and roles
- Quizzes: create, publish, and auto-grade objective questions
- Assignments: publish briefs and receive trainee submissions
- Trainee dashboard with personal progress overview
- Instructor dashboard to track submissions across groups

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT (access + refresh tokens)
- **DevOps:** Docker and docker compose for the API and database
- **Deployment (planned):** Vercel (client), Render (API), MongoDB Atlas (free tier)

## Project Structure

```
classflow/
├── client/            # React frontend (Vite + Tailwind CSS)
├── server/            # Express REST API (Node.js)
│   ├── src/           # routes, controllers, services, models, middleware, utils
│   └── Dockerfile     # API container image
├── docs/              # Planning notes, API reference, schema drafts
├── docker-compose.yml # Starts the API + MongoDB together
├── .gitignore
└── README.md
```

## Getting Started

### Run with Docker (easiest)

Only Docker needs to be installed. One command builds the API image and starts
it together with a MongoDB container:

```bash
docker compose up --build
```

- API health check: http://localhost:5000/api/health
- Stop: Ctrl+C, then `docker compose down` (add `-v` to also delete the database data)

### Run locally (without Docker)

Requires Node.js 20+ and MongoDB running locally (or a MongoDB Atlas URI).

```bash
cd server
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

Optional integrations read their values from `.env` (see `.env.example`):
`GOOGLE_CLIENT_ID` for Google sign-in and `SMTP_*` for password-reset emails.

## Roadmap

- [x] Authentication with instructor/trainee roles (JWT, Google sign-in, password reset)
- [x] Docker setup (API + MongoDB with docker compose)
- [ ] Quiz creation and automatic grading
- [ ] Assignment publishing and submissions
- [ ] Instructor and trainee dashboards
- [ ] CI/CD with GitHub Actions (planned)
- [ ] AI study assistant for trainees (planned)
- [ ] PostgreSQL reporting layer (planned)
