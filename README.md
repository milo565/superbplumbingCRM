# Kaizen Coastal CRM

A mobile-friendly CRM and job-management workspace for **Kaizen Coastal Air Conditioning** (also Kaizen Coastal Airconditioning) — residential and commercial air conditioning across the **Gold Coast (QLD)** and **Northern NSW**, based in **Tugun**.

Public listing: [hipages — Kaizen Coastal Airconditioning](https://hipages.com.au/connect/kaizencoastalairconditioning).

The board is simple: who needs a service today, what was installed last visit, which filters are due, and which past customers are worth a calm follow-up.

> The perfect temperature all year round.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL (Docker locally, Neon on Vercel)
- NextAuth credentials login with role-based access
- Barlow Condensed (headings) + DM Sans (body, nav, forms)

## Go live

Production is **Vercel + Neon Postgres**. Follow **[DEPLOY.md](./DEPLOY.md)** — Neon project, Vercel import, env vars, `prisma migrate deploy`, domain, then install the PWA over HTTPS.

## Quick start (local)

You need Docker (or any Postgres) and Node 20+.

```bash
cp .env.example .env
npm install
docker compose up -d
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`.env.example` defaults to `postgresql://kaizen:kaizen@localhost:5432/kaizen` from `docker-compose.yml`. You can also point `DATABASE_URL` at a free Neon branch for local work.

No SQLite in this tree — one Prisma schema, same as production.

## Demo logins

Password for every seeded account: **`KaizenCoastal1!`**

| Role | Name | Email |
| --- | --- | --- |
| Business owner / administrator | Kai Vincent | `kai@kaizencoastal.com.au` |
| Office administrator | Maya Chen | `office@kaizencoastal.com.au` |
| Field supervisor | Tom Reeves | `tom@kaizencoastal.com.au` |
| Technician | Jordan Walsh | `jordan@kaizencoastal.com.au` |
| Technician | Riley Nguyen | `riley@kaizencoastal.com.au` |
| Sales & customer follow-up | Sophie Hart | `sophie@kaizencoastal.com.au` |

Technicians only see customers and jobs assigned to them. Owners see the full board. Demo phones and `@kaizencoastal.com.au` addresses are placeholders — not live inboxes.

## What you can do

- **Dashboard** — clickable cards for today’s jobs, emergencies, unassigned work, quotes, invoicing, follow-ups, maintenance and revenue
- **Customers** — unique numbers, multi-site property-manager accounts, consent / opt-out, communication history, previous work
- **Properties** — outdoor unit, indoor heads, model/serial, refrigerant, isolator, mount notes, filter dates, warranty, site map
- **Jobs** — full enquiry → paid workflow for split / ducted / cassette install, repair, service, warranty and commercial maintenance; Google + Apple Maps; GST costing
- **Quotes & invoices** — branded documents, 10% GST, convert quote → job and job → invoice, payment tracking
- **Calendar** — day / week / month, click-to-call and maps
- **Previous work** — searchable completed jobs and “Create follow-up job”
- **Follow-ups** — 6 / 12-month filter and service reminders, approval before send, opt-out block, snooze
- **Maintenance plans** — six-monthly, annual, commercial, PM portfolio, custom
- **Reports** — revenue, conversion, repeat rate, service mix, CSV export
- **Team & settings** — roles, templates, audit trail, Xero / MYOB / SMS stubs
- **Installable app** — Add to Home Screen / Install app (PWA) for phones and tablets
- **SuperbBOT** — in-app assistant (header button) for call briefs, follow-up drafts, triage and work notes. Server-side `XAI_API_KEY` only.

SMS, email gateways and accounting exports are stored locally and not sent to live providers.

## Maps (Google + Apple)

Create Job, job detail and property pages show an embedded map of the Gold Coast / Northern NSW site address.

- **Google Maps** — iframe embed from the street address (`maps.google.com/...&output=embed`). Works in the demo with no API key. Optional `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` switches to the official Maps Embed API.
- **Apple Maps** — “Open in Apple Maps” / directions (`https://maps.apple.com/?q=...`) plus an on-page pin panel. Optional `NEXT_PUBLIC_APPLE_MAPS_TOKEN` (MapKit JS JWT) embeds a live Apple map.
- Staff confirm the pin when raising a job. Click-to-call stays next to both direction links.

No map secrets are required for the seeded Tugun / Coolangatta / Burleigh / Robina / Tweed Heads / Banora Point / Kingscliff demo addresses.

## SuperbBOT

**SuperbBOT** sits in the header. It reads the current customer, job, quote, property or follow-up and can draft SMS/email, summarise a call, suggest the next job status, or explain a dashboard card. It is trained in-prompt as a Kaizen Coastal air conditioning assistant — not plumbing.

- Server-only: set `XAI_API_KEY` (optional `XAI_MODEL`, default `grok-4`). Get a key at [console.x.ai](https://console.x.ai).
- The key never reaches the browser. Settings shows **configured** or **Add XAI_API_KEY to enable SuperbBOT**.
- SuperbBOT does not send messages. Staff still approve outbound copy. Opt-outs are flagged.
- Owner, office, supervisor and sales can use it. Technicians can ask about jobs assigned to them.

## Use as an app (PWA)

Kaizen Coastal CRM is a Progressive Web App. Staff can install it on a phone or tablet and launch it fullscreen — jobs, maps and follow-ups included.

### iPhone / iPad (Safari)

1. Open the CRM URL in Safari (Home Screen install does not work from Chrome on iOS).
2. Tap **Share**.
3. Tap **Add to Home Screen**, then **Add**.
4. Open **Kaizen** from the home screen. It runs standalone (no Safari chrome).

### Android / Chrome / Edge

1. Open the CRM in Chrome or Edge.
2. Tap the menu (⋮) → **Install app** or **Add to Home screen**.
3. Or tap **Install app** when the in-app banner appears (Chrome `beforeinstallprompt`).

### Local testing

- `http://localhost:3000` is enough for service worker and install on desktop Chrome.
- Phones talking to your laptop need HTTPS or a trusted local tunnel. A deployed HTTPS URL is the real van setup.
- The service worker caches the app shell, icons, and recently opened pages (dashboard / jobs). It does **not** cache `/api/auth`, so login still needs a network. Full offline job sync is not in this demo.

Theme colour `#0A3340`, background `#F6F1E8`, display `standalone`. Icons live in `public/icons/`.

## Locale

- Dates: `DD/MM/YYYY`
- Money: AUD including GST at 10%
- Timezone: Australia/Brisbane (Gold Coast)

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Reload Gold Coast / Northern NSW demo data |
| `npm run db:up` | Start local Docker Postgres |
| `npm run db:deploy` | `prisma migrate deploy` (production / CI) |
| `npm run db:reset` | Recreate the database and seed |
| `npm test` | SuperbBOT path / prompt helper tests |
| `npx prisma studio` | Browse data |
