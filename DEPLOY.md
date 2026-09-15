# Go live — Kaizen Coastal CRM on Vercel

**Kaizen Coastal Air Conditioning** — home service in Tugun, Queensland. Gold Coast and Northern NSW.

- Address: The Parc, 2 Inland Dr, Tugun QLD 4224
- Phone: 0428 316 868 (`tel:+61428316868`)
- Hours: Open, closes 21:00 (Mon–Sun 07:00–21:00)

Short path: Neon Postgres + Vercel + this repo. Local demo still uses Docker Postgres (see README). The GitHub repo name is still `superbplumbingCRM`.

## 1. Use this code

Deploy the `cursor/superbflow-crm-e340` branch, or `main` once this rebrand is merged.

## 2. Create Postgres (Neon)

1. Open [https://console.neon.tech](https://console.neon.tech) and sign in.
2. **New project** → name `kaizen-coastal-crm` → region close to the Gold Coast (e.g. **AWS Asia Pacific (Sydney)** `ap-southeast-2`) → Postgres 16 → **Create**.
3. Open **Dashboard → Connection details**.
4. Copy the **direct** (unpooled) connection string. It looks like:

   `postgresql://USER:PASSWORD@ep-….ap-southeast-2.aws.neon.tech/neondb?sslmode=require`

5. Keep that string for `DATABASE_URL`. Use the **unpooled** URL for `prisma migrate deploy`. The pooled URL is optional later for serverless pooling.

## 3. Import the repo on Vercel

1. Open [https://vercel.com/new](https://vercel.com/new).
2. **Import** `milo565/superbplumbingCRM`.
3. Framework: **Next.js** (auto).
4. Root directory: `.`
5. Build command (already in `vercel.json`): `prisma generate && next build`  
   This does **not** talk to the database. Migrations run after env is set (step 6).
6. Do **not** add a production seed to the build.

## 4. Environment variables

In Vercel → Project → **Settings → Environment Variables**, add at least Production (and Preview if you want).

| Name | Example / notes |
| --- | --- |
| `DATABASE_URL` | Neon unpooled string from step 2 |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` first, then `https://crm.kaizencoastal.com.au` |
| `NEXTAUTH_SECRET` | Long random string (`openssl rand -base64 32`). **Not** the demo value |
| `FOLLOWUP_REQUIRE_APPROVAL` | `true` recommended |
| `XAI_API_KEY` | Optional. In-app SuperbBOT assistant. Get a key at [console.x.ai](https://console.x.ai). Never commit it. |
| `XAI_MODEL` | Optional. Default `grok-4`. Set `grok-4.6` if your xAI account has it. |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Optional |
| `NEXT_PUBLIC_APPLE_MAPS_TOKEN` | Optional MapKit JWT |

Redeploy after saving vars so the first build sees them. `NEXTAUTH_URL` must match the URL people type in the browser (scheme + host, no trailing slash).

## 5. Build vs migrate

- **Build (Vercel):** `prisma generate && next build` — works even if the database is briefly unreachable.
- **Schema (production):** `npx prisma migrate deploy` — apply `prisma/migrations` to Neon.

Do not run `prisma migrate dev` against production.

## 6. First deploy: migrate (and optional staging seed)

After the first successful deploy, apply migrations once:

```bash
# From your laptop, with the Neon URL (never commit it)
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
npx prisma migrate deploy
```

Or: `npx vercel env pull .env.production.local` then use that `DATABASE_URL`.

**Seed (staging only).** The seed creates Gold Coast / Northern NSW demo customers and the shared password `KaizenCoastal1!`. **Do not seed a live customer-facing production database** unless you immediately change every password.

```bash
# Staging / empty preview only
npx prisma db seed
```

Then sign in and change every demo user password (or skip seed and create the owner by hand).

## 7. Custom domain

1. Vercel → Project → **Settings → Domains** → add `crm.kaizencoastal.com.au`.
2. At your DNS host, add the CNAME (or A) Vercel shows.
3. Set `NEXTAUTH_URL=https://crm.kaizencoastal.com.au` and redeploy.

## 8. Security after go-live

- Rotate `NEXTAUTH_SECRET` if it was ever shared.
- Change or delete seeded accounts. Demo password `KaizenCoastal1!` is **not** for production.
- Restrict who can access the Vercel project and Neon dashboard.
- Keep follow-up SMS/email stubs until real gateways and consent checks are wired.
- SuperbBOT drafts copy only. Staff still approve SMS/email. Do not put `XAI_API_KEY` in client env (`NEXT_PUBLIC_*`).

## 9. Install the PWA on phones

Once the site is HTTPS:

- **iPhone:** Safari → Share → Add to Home Screen.
- **Android:** Chrome → menu → Install app.

Localhost is fine for a desk test. Vans need the live HTTPS URL.

## 10. Troubleshooting

| Symptom | Likely fix |
| --- | --- |
| Sign-in loops or CSRF errors | `NEXTAUTH_URL` does not match the public URL (www vs apex, http vs https) |
| `P1001` / can't reach database | Neon paused, wrong host, missing `?sslmode=require`, or IP/firewall |
| `P3005` / migrate failed | You pointed migrate at a DB that already has tables from a partial run. Use a fresh Neon branch, or `prisma migrate resolve` only if you know the history |
| App builds, pages 500 | Migrations not applied — run `npx prisma migrate deploy` |
| Maps blank | Fine without keys; check the address still has street + suburb + postcode |
| PWA won't install on iPhone | Must use Safari on the HTTPS domain, not Chrome on iOS |
| SuperbBOT says add `XAI_API_KEY` | Set the key in Vercel env (Production + Preview), redeploy. Settings shows configured vs not — never the raw key |
| SuperbBOT key rejected | Rotate the key at [console.x.ai](https://console.x.ai). Confirm `XAI_MODEL` is a chat model your account can call |

## Local Postgres (optional)

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run db:seed
npm run dev
```

See README for the rest of the local flow.
