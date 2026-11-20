import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",
  roomIdleTtlMs: Number(process.env.ROOM_IDLE_TTL_MS ?? 1_800_000),
  /** Keep empty rooms after last disconnect so invitees can still join / hosts can reconnect. */
  disconnectGraceMs: Number(process.env.DISCONNECT_GRACE_MS ?? 180_000),
  chatRateLimitPerMin: Number(process.env.CHAT_RATE_LIMIT_PER_MIN ?? 20),
  ai: {
    enabled: process.env.AI_ENABLED === "true" && Boolean(process.env.AI_API_KEY),
    apiKey: process.env.AI_API_KEY ?? "",
    baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
    timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 12_000),
  },
};
