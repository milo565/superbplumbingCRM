# SuperbFlow CRM

A mobile-friendly CRM and job-management workspace for **SuperbFlow Plumbing** ([superbflowplumbing.com.au](https://superbflowplumbing.com.au)) — Melbourne plumbing and property services across residential, commercial and industrial work.

The point of the board is simple: who needs a hand today, what was done last visit, what maintenance is coming due, and which past customers are worth a calm follow-up.

> No drama. Just flow.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite for local demo (schema is PostgreSQL-ready)
- NextAuth credentials login with role-based access
- Barlow Condensed (headings) + DM Sans (body, nav, forms)

## Quick start

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env` if you need to change the database URL or `NEXTAUTH_SECRET`.

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-in-production-use-a-long-random-string"
```

For PostgreSQL later, switch `provider` in `prisma/schema.prisma` to `postgresql` and point `DATABASE_URL` at your server. Models and enums stay the same.

## Demo logins

Password for every seeded account: **`SuperbFlow1!`**

| Role | Name | Email |
| --- | --- | --- |
| Business owner / administrator | Anthony Rossi | `anthony@superbflowplumbing.com.au` |
| Office administrator | Priya Nair | `office@superbflowplumbing.com.au` |
| Plumbing supervisor | Nathan Blake | `nathan@superbflowplumbing.com.au` |
| Plumber / technician | Liam Chen | `liam@superbflowplumbing.com.au` |
| Plumber / technician | Sam Okonkwo | `sam@superbflowplumbing.com.au` |
| Sales & customer follow-up | Jess Moretti | `jess@superbflowplumbing.com.au` |

Plumbers only see customers and jobs assigned to them. Owners see the full board.

## What you can do

- **Dashboard** — clickable cards for today’s jobs, emergencies, unassigned work, quotes, invoicing, follow-ups, maintenance and revenue
- **Customers** — unique numbers, multi-site property-manager accounts, consent / opt-out, communication history, previous work
- **Properties** — access, keys, pets, meters, gas, roofing, compliance, work history and an embedded site map
- **Jobs** — full enquiry → paid workflow, embedded Google + Apple Maps, check-in / out, GST costing, complete-with-follow-up
- **Quotes & invoices** — branded documents, 10% GST, convert quote → job and job → invoice, payment tracking
- **Calendar** — day / week / month, click-to-call and maps
- **Previous work** — searchable completed jobs and “Create follow-up job”
- **Follow-ups** — 30 / 14 / due / 7 / 21 sequence, approval before send, opt-out block, snooze
- **Maintenance plans** — six-monthly, annual, commercial, PM portfolio, custom
- **Reports** — revenue, conversion, repeat rate, service mix, CSV export
- **Team & settings** — roles, templates, audit trail, Xero / MYOB / SMS stubs
- **Installable app** — Add to Home Screen / Install app (PWA) for phones and tablets

SMS, email gateways and accounting exports are stored locally and not sent to live providers.

## Maps (Google + Apple)

Create Job, job detail and property pages show an embedded map of the Melbourne site address.

- **Google Maps** — iframe embed from the street address (`maps.google.com/...&output=embed`). Works in the demo with no API key. Optional `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` switches to the official Maps Embed API.
- **Apple Maps** — “Open in Apple Maps” / directions (`https://maps.apple.com/?q=...`) plus an on-page pin panel. Optional `NEXT_PUBLIC_APPLE_MAPS_TOKEN` (MapKit JS JWT) embeds a live Apple map. How to mint a token: [Apple MapKit JS](https://developer.apple.com/documentation/mapkitjs).
- Staff confirm the pin as the next sensible step when raising a job. Click-to-call stays next to both direction links.

No map secrets are required for the seeded Taylors Lakes / Wheelers Hill / CBD demo addresses.

## Use as an app (PWA)

SuperbFlow CRM is a Progressive Web App. Staff can install it on a phone or tablet and launch it fullscreen — jobs, maps and follow-ups included.

### iPhone / iPad (Safari)

1. Open the CRM URL in Safari (Home Screen install does not work from Chrome on iOS).
2. Tap **Share**.
3. Tap **Add to Home Screen**, then **Add**.
4. Open **SuperbFlow** from the home screen. It runs standalone (no Safari chrome).

### Android / Chrome / Edge

1. Open the CRM in Chrome or Edge.
2. Tap the menu (⋮) → **Install app** or **Add to Home screen**.
3. Or tap **Install app** when the in-app banner appears (Chrome `beforeinstallprompt`).

### Local testing

- `http://localhost:3000` is enough for service worker and install on desktop Chrome.
- Phones talking to your laptop need HTTPS or a trusted local tunnel. A deployed HTTPS URL is the real van setup.
- The service worker caches the app shell, icons, and recently opened pages (dashboard / jobs). It does **not** cache `/api/auth`, so login still needs a network. Full offline job sync is not in this demo.

Theme colour `#091825`, background `#F5F1EB`, display `standalone`. Icons live in `public/icons/`.

## Locale

- Dates: `DD/MM/YYYY`
- Money: AUD including GST at 10%
- Timezone: Australia/Melbourne

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Reload Melbourne demo data |
| `npm run db:reset` | Recreate SQLite database and seed |
| `npx prisma studio` | Browse data |
