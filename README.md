# PartyVerse

Premium browser-based multiplayer party gaming platform.

Play **Brain Battle**, **Chaos Challenge**, and **Bluff & Betray** with friends — no downloads, just a room code.

## Architecture

Monorepo (npm workspaces):

- `apps/web` — Next.js frontend (UI, 3D lobby, Socket.IO client)
- `apps/server` — Express + Socket.IO authoritative game server
- `packages/shared` — Shared TypeScript types + Zod socket contracts

Room state is in-memory behind a `RoomStore` interface (Redis-ready later).

## Quick start

```bash
# from repo root
cp .env.example apps/server/.env   # already seeded for local
# apps/web/.env.local already points at http://localhost:4000

npm install
npm run build:shared
npm run dev
```

- Web: http://localhost:3000
- Server health: http://localhost:4000/health

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run web + server together |
| `npm run dev:web` | Next.js only |
| `npm run dev:server` | Socket server only |
| `npm run build` | Build shared, server, web |
| `npm run build:shared` | Compile `@partyverse/shared` |

## Optional AI

Set in `apps/server/.env`:

```env
AI_ENABLED=true
AI_API_KEY=sk-...
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

Without AI credentials, curated fallback content is used automatically.

## Playtest

1. Open two browser profiles (or normal + incognito).
2. Create a room in one, join with the code in the other.
3. Ready up, host selects a mode, start the game.
4. Verify chat, scores, timers, and reconnection (refresh mid-game).

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Recommended:

- **Web** → Vercel
- **Server** → Railway / Fly.io / Render (persistent WebSockets)

Do not host the Socket.IO server on standard serverless platforms.
