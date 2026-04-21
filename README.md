# Desafio Fullstack

Projeto fullstack com:

- Backend: Node.js + TypeScript + Prisma + MySQL
- Frontend: React + Vite
- Mobile: Flutter

## Structure

- `backend`: API REST
- `frontend`: web app
- `mobile`: mobile app
- `docs`: project documentation

## Running with Docker

Requirements:

- Docker
- Docker Compose

At project root:

```bash
docker compose up -d --build
```

Default exposed ports:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3334`
- MySQL: `localhost:3308`

Stop stack:

```bash
docker compose down
```

## API docs

See:

- [docs/API.md](./docs/API.md)

## Local environment

Backend:

1. Copy `backend/.env.example` to `backend/.env`
2. Set local values for database and JWT secret

## Structured logs

Backend now emits structured JSON logs with:

- `timestamp`
- `level`
- `message`
- `context` (when available)

Example:

```json
{
  "timestamp": "2026-04-20T21:00:00.000Z",
  "level": "INFO",
  "message": "http.request",
  "context": {
    "method": "GET",
    "path": "/clients",
    "statusCode": 200,
    "durationMs": 12
  }
}
```

## Automated tests (backend)

Run inside `backend`:

1. Start test database:

```bash
npm run test:db:up
```

2. Apply migrations to test database:

```bash
npm run test:prepare
```

3. Run tests:

```bash
npm run test
```

Optional cleanup:

```bash
npm run test:db:down
```

## CI

Basic CI is configured in:

- `.github/workflows/ci.yml`

Current checks:

- Backend build
- Backend automated tests (Vitest + Supertest)
- Frontend build
- Docker Compose config validation

## CD

Continuous Delivery is configured in:

- `.github/workflows/cd.yml`

What it does:

- Runs automatically after `CI` succeeds on `main` or `master`
- Can also be run manually with `workflow_dispatch`
- Builds and publishes Docker images to GitHub Container Registry (GHCR)

Published images:

- `ghcr.io/<owner>/desafio-fullstack-backend`
- `ghcr.io/<owner>/desafio-fullstack-frontend`

Tags:

- `latest` (for `main/master`)
- `sha-<commit>` style tag generated from commit SHA

Optional secret:

- `VITE_API_URL_PROD`: public API URL used in frontend production build

Notes:

- `GITHUB_TOKEN` is used for auth in GHCR (no extra token required for same repo)
- For private repos/packages, ensure package visibility and access policy are configured in GitHub

## Delivery Checklist

- API REST with auth, clients and tasks
- Web app complete
- Mobile app with add/edit/delete for clients and tasks + status update
- External CEP integration
- Docker setup for backend, frontend and database
- API documentation
- Structured logs
- Automated backend tests
- CI pipeline
- CD pipeline
