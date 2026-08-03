# HydraDB Growth Dashboard — Backend

Node.js + TypeScript + Express + Prisma/PostgreSQL backend that syncs metrics from PostHog, Google Search Console, Ahrefs, Twitter/X, Discord, and Reddit on a schedule, stores history, computes analytics/alerts/executive reports, and serves it all over a REST API.

## Architecture

```
src/
  api/            Express app: routes, zod validation middleware, pagination/date-range/sort/compare utils
  integrations/   One folder per third-party service, each exposing authenticate()/fetch()/normalize()/store()
  scheduler/      SchedulerPort interface + BullMQ (default) and Trigger.dev adapters, single jobs registry
  services/       analytics (growth/trend/anomaly/scores), alerts (rule engine), reports (executive report generator)
  db/             Prisma client singleton
  lib/            env validation, logger, retry, error types
prisma/           schema.prisma, migrations, seed.ts
```

The frontend never talks to PostHog/GSC/Ahrefs/etc. directly — every external service has its own integration module, and the API only ever reads from Postgres (populated by scheduled syncs), never live-proxies a third-party call.

### Integration module pattern

Every integration in `src/integrations/<name>/` has the same 6 files:

- `types.ts` — the raw payload shape (matching that service's real documented API response) and the normalized DB-record shape.
- `client.ts` — real HTTP calls against the service's actual API.
- `mock-client.ts` — same interface, returns generated fixture data (ported from the frontend's original `lib/mock-data/*.ts` faker generators, so mock output looks like the dashboard's original demo).
- `normalize.ts` — raw → DB record shape (identical in both modes).
- `store.ts` — Prisma upsert(s) (identical in both modes).
- `index.ts` — picks real vs. mock client based on `MOCK_MODE` / credential presence, exposes the `IntegrationModule` contract.

Adding a new integration (GitHub, Hacker News, Product Hunt, LinkedIn, ...) means creating one new folder following this pattern and adding one line to `src/scheduler/jobs.ts` — nothing else in the system changes.

### Scheduler

`SCHEDULER_DRIVER=bullmq` (default) runs entirely self-hosted against Redis — works with zero external accounts. `SCHEDULER_DRIVER=trigger` uses Trigger.dev instead; set `TRIGGER_API_KEY` and deploy via `npx trigger.dev@latest deploy` to activate the cron schedules (Trigger.dev tasks run on Trigger.dev's infrastructure, not in the local worker process). Both implement the same `SchedulerPort` interface, so nothing else in the codebase branches on which one is active.

Jobs: PostHog/Twitter/Discord/Reddit sync hourly, Google Search Console/Ahrefs (which also covers Keyword Rankings and Competitor Metrics in the same run) daily, Executive Report generation every Monday.

## Running

### Fully mocked (no credentials needed)

```bash
cp .env.example .env   # MOCK_MODE=true by default
npm install
docker compose -f ../docker-compose.yml up -d postgres redis
npx prisma migrate dev
npx prisma db seed
npm run dev            # API on :4000
npm run dev:worker     # scheduler/worker (separate terminal)
```

Or just `docker compose up` from the repo root, which brings up Postgres/Redis/API/worker/frontend together.

### Health check & API docs

- `GET /api/v1/health` — combined DB/Redis/scheduler/circuit-breaker status (also `/health/live`, `/health/ready` for container probes).
- `GET /api/v1/docs` — Swagger UI, generated from the zod schemas via `npm run docs:generate`.

## Connecting real integrations

Every integration defaults to mock mode automatically if its credentials aren't set — so you can connect them one at a time. Set `MOCK_MODE=false` globally, or leave it `true` and override per-integration with `<NAME>_MOCK_MODE=false` once that integration's credentials are filled in. All env vars are listed in `.env.example`.

| Integration | Env vars | Where to get them |
|---|---|---|
| **PostHog** | `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_HOST` | Personal API key (read scope) at Settings → Personal API Keys in your PostHog project. Uses the Query API (`/api/projects/:id/query/`). |
| **Google Search Console** | `GSC_SITE_URL`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Create a service account in Google Cloud Console, enable the Search Console API, add the service account email as a full user on the property in Search Console. Scope: `webmasters.readonly`. |
| **Ahrefs** | `AHREFS_API_TOKEN`, `AHREFS_TARGET` | API v3 token from ahrefs.com/api/documentation — requires a paid Ahrefs subscription. |
| **Twitter / X** | `TWITTER_BEARER_TOKEN`, `TWITTER_USERNAME` | App-only bearer token from the X Developer Portal. Note: the standard API tier doesn't expose historical daily followers/profile-visits/engagement-rate (Enterprise-only) — the real client returns current-day snapshots for those fields, with `TWITTER_MOCK_MODE` as the fallback for full historical charts. |
| **Discord** | `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID` | Bot token from the Discord Developer Portal. Invite the bot with "Server Members Intent" enabled and View Channels / Read Message History permissions. Like Twitter, historical daily series aren't available from Discord's REST API — real-mode syncs capture current-day snapshots. |
| **Reddit** | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`, `REDDIT_USER_AGENT` | Script-type OAuth2 app at reddit.com/prefs/apps. The keyword watchlist it monitors is stored in the `settings` table (`reddit.keywords`, seeded with HydraDB/GraphRAG/Knowledge Graph/Context Graph/Graph Database/AI Agent Memory) — edit via `PUT /api/v1/settings/reddit.keywords`. |

### Running fully mocked vs. connecting real integrations

- **Fully mocked** (default): `MOCK_MODE=true`, no credentials needed anywhere — every integration generates realistic historical fixture data.
- **One real integration at a time**: fill in that integration's env vars in `.env`, set its `<NAME>_MOCK_MODE=false` (or set `MOCK_MODE=false` globally once all are ready). Missing credentials always fall back to mock mode automatically, so a partially-configured deploy degrades gracefully instead of crashing.
