# PartyVerse Deployment

## Overview

PartyVerse needs two deployable units:

1. **Frontend** (`apps/web`) — static/SSR Next.js app
2. **Realtime server** (`apps/server`) — long-lived Node process with Socket.IO

Standard serverless hosts (e.g. Vercel serverless functions) are fine for the web app but **not** for the multiplayer server.

## Environment variables

### Web (`apps/web`)

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_SOCKET_URL` | `https://api.yourdomain.com` | Public Socket.IO origin |

### Server (`apps/server`)

| Variable | Example | Notes |
|---|---|---|
| `PORT` | `4000` | Platform may override |
| `CORS_ORIGIN` | `https://partyverse.yourdomain.com` | Comma-separated allowed |
| `NODE_ENV` | `production` | |
| `ROOM_IDLE_TTL_MS` | `1800000` | Idle room cleanup |
| `CHAT_RATE_LIMIT_PER_MIN` | `20` | Chat spam guard |
| `AI_ENABLED` | `false` | Optional |
| `AI_API_KEY` | | Never expose to clients |
| `AI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible |
| `AI_MODEL` | `gpt-4o-mini` | |
| `AI_TIMEOUT_MS` | `12000` | |

## Suggested platforms

### Frontend — Vercel

```bash
# from apps/web (or configure root monorepo build)
# Build command:
npm run build -w @partyverse/shared && npm run build -w @partyverse/web

# Output: Next.js default
```

Set `NEXT_PUBLIC_SOCKET_URL` to your server URL.

### Backend — Railway / Fly.io / Render

Build:

```bash
npm install
npm run build -w @partyverse/shared
npm run build -w @partyverse/server
npm run start -w @partyverse/server
```

Health check: `GET /health` → `{ ok: true }`.

Ensure WebSocket / sticky sessions are enabled if you later scale horizontally. MVP uses in-memory rooms → **single server instance** only until Redis is introduced.

## CORS checklist

1. `CORS_ORIGIN` on server matches the deployed web origin exactly (including `https`).
2. Socket.IO client uses `NEXT_PUBLIC_SOCKET_URL` without a trailing path unless you reverse-proxy intentionally.
3. If using a reverse proxy, enable WebSocket upgrade headers.

## Production smoke test

- [ ] `/` loads landing page
- [ ] `/health` returns ok
- [ ] Create room + join from second device
- [ ] Chat messages sync
- [ ] Brain Battle completes a round
- [ ] Refresh mid-game reconnects
- [ ] AI off still serves curated content

## Monitoring (lightweight)

- Platform health checks on `/health`
- Log disconnect storms / room cleanup
- Optional: Sentry later (not required for MVP)

## Ads readiness (future)

Reserve landing-page and between-game slots only. Never inject ads into active gameplay views (`BrainBattle`, `ChaosChallenge`, `BluffBetray`).
