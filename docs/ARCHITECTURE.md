# PartyVerse Architecture

## High-level

```
Browser (Next.js)  --Socket.IO-->  Node game server
        |                               |
   UI + R3F lobby                 RoomStore (memory)
   shared Zod contracts           Game engines + AI adapters
```

## Authority

The server owns:

- Room membership and host transfer
- State machine transitions
- Timers
- Scoring / votes / answer validation
- Private role distribution (targeted emits only)

Clients send intents only. Public `room:state` never includes secret roles or hidden objectives.

## Packages

| Package | Role |
|---|---|
| `@partyverse/web` | App Router pages, design system, game UIs, lazy R3F |
| `@partyverse/server` | Express health + Socket.IO handlers + engines |
| `@partyverse/shared` | Constants, domain types, Zod event contracts |

## Room FSM

`WAITING → GAME_SELECTION → PREPARING_ROUND → IN_PROGRESS → ROUND_RESULTS → (loop) → GAME_RESULTS → WAITING | CLOSED`

## AI

Provider interface (`AiProvider`) with OpenAI-compatible implementation. Generators fall back to curated banks when AI is disabled, times out, fails schema validation, or fails moderation.

## Scaling path

Replace `InMemoryRoomStore` with Redis-backed store; keep `RoomService` API stable. Prefer sticky sessions or single-writer room ownership when multi-instance.
