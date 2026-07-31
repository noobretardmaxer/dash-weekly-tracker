This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Backend

The dashboard is backed by a standalone Node/TypeScript API + worker service in [`server/`](server), storing history in Postgres and syncing from PostHog, Google Search Console, Ahrefs, Twitter/X, Discord, and Reddit on a schedule (BullMQ by default, Trigger.dev optionally). See [`server/README.md`](server/README.md) for the full architecture (integration module pattern, database schema, scheduler, analytics/alerts/report generation) and exactly how to connect each real integration.

### Quickest path: fully mocked, zero credentials

```bash
docker compose up
```

This brings up Postgres, Redis, the API, the worker, and the frontend, all running against generated fixture data (`MOCK_MODE=true` by default) — nothing to configure. Frontend at http://localhost:3000, API at http://localhost:4000 (proxied through the frontend's `/api/*` routes), Swagger docs at http://localhost:4000/api/v1/docs.

### Local development (without Docker)

```bash
cd server
cp .env.example .env
npm install
docker compose up -d postgres redis   # or point DATABASE_URL/REDIS_URL at your own instances
npx prisma migrate dev
npx prisma db seed
npm run dev          # API on :4000
npm run dev:worker   # scheduler/worker, in a second terminal

cd ..
API_URL=http://localhost:4000 npm run dev   # frontend on :3000
```

### Connecting a real integration

Leave everything on `MOCK_MODE=true` and flip one integration at a time by setting its credentials in `server/.env` and its `<INTEGRATION>_MOCK_MODE=false` override — see `server/.env.example` for the full list of env vars per integration (PostHog, GSC, Ahrefs, Twitter/X, Discord, Reddit) and `server/README.md` for where to obtain each one.
