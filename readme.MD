# Superb Plumbing CRM

A small full-stack CRM for a plumbing business. Manage customers and dispatch
plumbing jobs, track job status and priority, and see pipeline vs. completed
revenue at a glance.

## Stack

- **Backend** (`server/`): Node.js + Express + TypeScript, SQLite via
  `better-sqlite3`. Auto-creates its schema and seeds sample data on first boot.
- **Frontend** (`web/`): React + TypeScript + Vite. Talks to the API through a
  dev-server proxy (`/api` → `http://localhost:4000`).
- **Tooling**: npm workspaces monorepo.

## Prerequisites

- Node.js >= 20 (developed against Node 22)
- npm 10+

## Getting started

```bash
npm ci            # install all workspace dependencies
npm run dev       # start API (:4000) and web (:5173) together
```

Then open http://localhost:5173.

Run the two services separately if you prefer:

```bash
npm run dev:server   # API only,  http://localhost:4000
npm run dev:web      # web only,  http://localhost:5173
```

## Useful commands

| Command | Description |
| --- | --- |
| `npm ci` | Install dependencies from the lockfile |
| `npm run dev` | Run API + web dev servers in parallel |
| `npm run build` | Type-check/build both packages |
| `npm run typecheck` | Type-check both packages without emitting |
| `npm run seed` | Seed sample data (no-op if data exists; `CRM_FORCE_SEED=1` to reset) |
| `npm start` | Run the compiled API server (`npm run build` first) |

## API overview

Base URL: `http://localhost:4000`

- `GET  /api/health` — service health
- `GET  /api/stats` — dashboard counters (customers, jobs by status, revenue)
- `GET  /api/customers` — list customers (with job counts)
- `POST /api/customers` — create a customer (`name` required)
- `GET  /api/customers/:id` — customer detail with their jobs
- `DELETE /api/customers/:id` — delete a customer (cascades to their jobs)
- `GET  /api/jobs` — list jobs (filter with `?status=` or `?customer_id=`)
- `POST /api/jobs` — create a job (`customer_id`, `title` required)
- `PATCH /api/jobs/:id` — update a job (e.g. change `status`)
- `DELETE /api/jobs/:id` — delete a job

Job statuses: `scheduled`, `in_progress`, `completed`, `cancelled`.
Job priorities: `low`, `normal`, `high`, `emergency`.

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | API server port |
| `CRM_DB_PATH` | `server/data/crm.sqlite` | SQLite database file location |
| `CRM_FORCE_SEED` | _(unset)_ | `1` wipes and re-seeds sample data |
| `VITE_API_TARGET` | `http://localhost:4000` | API target for the Vite dev proxy |

## Cloud Agent environment

`.cursor/environment.json` installs dependencies with `npm ci` and starts the
API and web dev servers as two long-running terminals, exposing ports 4000 and
5173.
