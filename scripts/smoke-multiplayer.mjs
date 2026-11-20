import { io } from "socket.io-client";

const URL = process.env.SOCKET_URL || "http://localhost:4000";

function onceAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${event}`)), 8000);
    socket.emit(event, payload, (res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

function connect(name) {
  return new Promise((resolve, reject) => {
    const socket = io(URL, { transports: ["websocket"] });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
    setTimeout(() => reject(new Error(`connect timeout ${name}`)), 8000);
  });
}

const host = await connect("host");
const guest = await connect("guest");

const created = await onceAck(host, "room:create", {
  nickname: "HostHero",
  avatar: "cat",
});
if (!created?.room?.code) throw new Error("create failed");
console.log("created", created.room.code);

const joined = await onceAck(guest, "room:join", {
  code: created.room.code,
  nickname: "GuestGal",
  avatar: "lion",
});
if (!joined?.room) throw new Error("join failed");
console.log("joined players", joined.room.players.length);

host.emit("chat:send", { text: "hello party" });
await new Promise((r) => setTimeout(r, 300));

host.emit("game:select", {
  mode: "brain",
  brain: {
    category: "festivals",
    difficulty: "easy",
    rounds: 3,
    timePerQuestionMs: 15000,
  },
});
await new Promise((r) => setTimeout(r, 200));
host.emit("game:start");

await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("game start timeout")), 10000);
  guest.on("room:state", (room) => {
    if (room.state === "IN_PROGRESS" && room.brainQuestion) {
      clearTimeout(timer);
      console.log("question", room.brainQuestion.prompt.slice(0, 60));
      resolve(room);
    }
  });
});

console.log("SMOKE_OK");
host.close();
guest.close();
process.exit(0);
