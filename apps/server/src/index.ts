import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config";
import { InMemoryRoomStore } from "./rooms/RoomStore";
import { RoomService } from "./rooms/RoomService";
import { startRateLimitCleanup } from "./security/rateLimit";
import { registerHandlers } from "./socket/handlers";

const app = express();
app.use(cors({ origin: config.corsOrigin.split(",").map((s) => s.trim()) }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "partyverse-server",
    aiEnabled: config.ai.enabled,
    time: new Date().toISOString(),
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin.split(",").map((s) => s.trim()),
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 20000,
});

const store = new InMemoryRoomStore();
const rooms = new RoomService(store);
registerHandlers(io, store, rooms);
startRateLimitCleanup();

setInterval(() => rooms.cleanupIdle(), 60_000).unref();

httpServer.listen(config.port, () => {
  console.log(`PartyVerse server listening on :${config.port}`);
  console.log(`CORS origin: ${config.corsOrigin}`);
  console.log(`AI enabled: ${config.ai.enabled}`);
});
