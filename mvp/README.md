# Global Football Prediction Lab MVP

Public-facing MVP for an independent football forecasting experience.

## What is implemented

- Tournament outlook dashboard (champion/finalist probabilities + fixtures)
- Team Lab (`/teams`) and team detail pages (`/teams/[slug]`)
- Player Board (`/players`) for top scorer, assists, and cards projections
- Scenario Lab (`/scenario`) with interactive what-if outcomes
- Agent Feed (`/agent-feed`) showing explainability messages
- API snapshot endpoint (`/api/snapshot`)
- Data layer with:
  - mock seed dataset (default)
  - optional API-Football connector
  - optional football-data.org connector
  - TTL in-memory caching to limit external requests

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open: `http://localhost:3000`

## Data provider modes

Configure in `.env.local`:

```bash
DATA_PROVIDER=mock
```

Options:
- `mock` (default safe demo mode)
- `api-football`
- `football-data`
- `hybrid` (try API-Football -> football-data.org -> fallback mock)

## External API setup (optional)

### API-Football

```bash
API_FOOTBALL_KEY=your_key
API_FOOTBALL_HOST=v3.football.api-sports.io
API_FOOTBALL_SEASON=2026
API_FOOTBALL_LEAGUE_ID=1
```

### football-data.org

```bash
FOOTBALL_DATA_KEY=your_token
FOOTBALL_DATA_BASE_URL=https://api.football-data.org/v4
FOOTBALL_DATA_COMPETITION=WC
```

## Cache behavior

`DATA_CACHE_TTL_MINUTES` controls snapshot recomputation and external pull frequency.

Example:

```bash
DATA_CACHE_TTL_MINUTES=15
```

## Rate-limit-safe MVP behavior

- UI reads from internal snapshot only.
- API providers are called by server code, never from client browser.
- Single cached snapshot is reused across all pages.

## Recommended next build steps

1. Add persistent DB (Supabase) for snapshot history.
2. Add scheduled refresh jobs (Vercel Cron/GitHub Actions).
3. Expand provider normalization for player injuries and lineups.
4. Add shareable prediction card export for social/demo usage.

## Branding note

Keep product framed as independent and unofficial. Avoid using FIFA marks/logos/slogans in UI or metadata.
