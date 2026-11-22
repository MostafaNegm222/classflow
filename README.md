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
- **Deployment (planned):** Vercel (client), Render (API), MongoDB Atlas (free tier)

## Project Structure

```
classflow/
├── client/        # React frontend (Vite + Tailwind CSS)
├── server/        # Express REST API (Node.js)
├── docs/          # Planning notes, API reference, schema drafts
├── .gitignore
└── README.md
```

## Getting Started

Setup instructions are coming with the first code commit.

## Roadmap

- [ ] Authentication with instructor/trainee roles
- [ ] Quiz creation and automatic grading
- [ ] Assignment publishing and submissions
- [ ] Instructor and trainee dashboards
- [ ] AI study assistant for trainees (planned)
- [ ] Docker setup and CI/CD with GitHub Actions (planned)
- [ ] PostgreSQL reporting layer (planned)
