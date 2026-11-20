"use client";

import {
  SOCKET_EVENTS,
  type BluffPrivateInfo,
  type ChatMessage,
  type PublicRoom,
  type RoomJoinSuccess,
} from "@partyverse/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSocket } from "@/lib/socket";
import {
  clearMembership,
  loadMembership,
  saveMembership,
  type Membership,
} from "@/lib/session";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

interface GameSocketValue {
  connected: boolean;
  connectionStatus: ConnectionStatus;
  reconnecting: boolean;
  room: PublicRoom | null;
  playerId: string | null;
  error: string | null;
  setError: (msg: string | null) => void;
  privateBluff: BluffPrivateInfo | null;
  createRoom: (nickname: string, avatar: string) => Promise<RoomJoinSuccess>;
  joinRoom: (
    code: string,
    nickname: string,
    avatar: string
  ) => Promise<RoomJoinSuccess>;
  leaveRoom: () => void;
  emit: (event: string, payload?: unknown) => void;
  retryReconnect: () => Promise<boolean>;
  retryConnect: () => void;
}

const GameSocketContext = createContext<GameSocketValue | null>(null);

const MAX_RECONNECT_ATTEMPTS = 3;

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [reconnecting, setReconnecting] = useState(false);
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [privateBluff, setPrivateBluff] = useState<BluffPrivateInfo | null>(
    null
  );
  const membershipRef = useRef<Membership | null>(null);
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const attemptReconnect = useCallback(async (m: Membership): Promise<boolean> => {
    const socket = getSocket();
    for (let i = 0; i < MAX_RECONNECT_ATTEMPTS; i++) {
      const ok = await new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 4000);
        socket.emit(
          SOCKET_EVENTS.ROOM_RECONNECT,
          {
            code: m.code,
            playerId: m.playerId,
            membershipToken: m.membershipToken,
          },
          (res: RoomJoinSuccess & { ok?: boolean }) => {
            clearTimeout(timer);
            if (res?.room) {
              setRoom(res.room);
              setPlayerId(res.playerId);
              if (res.privateBluff) setPrivateBluff(res.privateBluff);
              setError(null);
              resolve(true);
            } else {
              resolve(false);
            }
          }
        );
      });
      if (ok) return true;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
    return false;
  }, []);

  useEffect(() => {
    const socket = getSocket();
    membershipRef.current = loadMembership();

    const onConnect = () => {
      setConnected(true);
      setReconnecting(false);
      setConnectionStatus("connected");
      if (connectTimer.current) {
        clearTimeout(connectTimer.current);
        connectTimer.current = null;
      }
      const m = membershipRef.current;
      if (m) {
        void attemptReconnect(m).then((ok) => {
          if (!ok) {
            setRoom((current) => {
              if (!current) {
                setError(
                  "Could not restore your seat. Retry or create a new room."
                );
              }
              return current;
            });
          }
        });
      }
    };

    const onDisconnect = () => {
      setConnected(false);
      setReconnecting(true);
      setConnectionStatus("reconnecting");
    };

    const onConnectError = () => {
      setConnectionStatus("offline");
      setConnected(false);
    };

    const onState = (next: PublicRoom) => {
      setRoom(next);
      setError(null);
    };
    const onError = (payload: { message?: string }) => {
      setError(payload.message ?? "Something went wrong");
      window.setTimeout(() => setError(null), 3500);
    };
    const onChat = (message: ChatMessage) => {
      setRoom((prev) =>
        prev ? { ...prev, chat: [...prev.chat.slice(-49), message] } : prev
      );
    };
    const onPrivate = (info: BluffPrivateInfo) => setPrivateBluff(info);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on(SOCKET_EVENTS.ROOM_STATE, onState);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, onError);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, onChat);
    socket.on(SOCKET_EVENTS.PRIVATE_BLUFF, onPrivate);

    setConnectionStatus("connecting");
    connectTimer.current = setTimeout(() => {
      if (!socket.connected) setConnectionStatus("offline");
    }, 5000);

    if (!socket.connected) socket.connect();
    else onConnect();

    return () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off(SOCKET_EVENTS.ROOM_STATE, onState);
      socket.off(SOCKET_EVENTS.ROOM_ERROR, onError);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, onChat);
      socket.off(SOCKET_EVENTS.PRIVATE_BLUFF, onPrivate);
    };
  }, [attemptReconnect]);

  const remember = useCallback((data: RoomJoinSuccess) => {
    const membership = {
      code: data.room.code,
      playerId: data.playerId,
      membershipToken: data.membershipToken,
    };
    membershipRef.current = membership;
    saveMembership(membership);
    setRoom(data.room);
    setPlayerId(data.playerId);
    setPrivateBluff(data.privateBluff ?? null);
    setError(null);
  }, []);

  const waitForConnect = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) return Promise.resolve();
    socket.connect();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Can't reach game server")),
        8000
      );
      socket.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }, []);

  const createRoom = useCallback(
    async (nickname: string, avatar: string) => {
      await waitForConnect();
      const socket = getSocket();
      return new Promise<RoomJoinSuccess>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Create room timed out")),
          10000
        );
        socket.emit(
          SOCKET_EVENTS.ROOM_CREATE,
          { nickname, avatar },
          (res: RoomJoinSuccess & { ok?: boolean }) => {
            clearTimeout(timer);
            if (!res?.room) {
              reject(new Error("Failed to create room"));
              return;
            }
            remember(res);
            resolve(res);
          }
        );
      });
    },
    [remember, waitForConnect]
  );

  const joinRoom = useCallback(
    async (code: string, nickname: string, avatar: string) => {
      await waitForConnect();
      const socket = getSocket();
      return new Promise<RoomJoinSuccess>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Join room timed out")),
          10000
        );
        socket.emit(
          SOCKET_EVENTS.ROOM_JOIN,
          { code, nickname, avatar },
          (res: RoomJoinSuccess & { ok?: boolean; error?: string }) => {
            clearTimeout(timer);
            if (!res?.room) {
              reject(new Error(res?.error ?? "Failed to join room"));
              return;
            }
            remember(res);
            resolve(res);
          }
        );
      });
    },
    [remember, waitForConnect]
  );

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit(SOCKET_EVENTS.ROOM_LEAVE);
    clearMembership();
    membershipRef.current = null;
    setRoom(null);
    setPlayerId(null);
    setPrivateBluff(null);
    setError(null);
  }, []);

  const emit = useCallback((event: string, payload?: unknown) => {
    getSocket().emit(event, payload);
  }, []);

  const retryReconnect = useCallback(async () => {
    const m = membershipRef.current ?? loadMembership();
    if (!m) return false;
    membershipRef.current = m;
    setError(null);
    setReconnecting(true);
    const socket = getSocket();
    if (!socket.connected) {
      try {
        await waitForConnect();
      } catch {
        setConnectionStatus("offline");
        setReconnecting(false);
        return false;
      }
    }
    const ok = await attemptReconnect(m);
    setReconnecting(false);
    if (!ok) {
      setError("Still couldn't restore your seat. Try creating a new room.");
    }
    return ok;
  }, [attemptReconnect, waitForConnect]);

  const retryConnect = useCallback(() => {
    setConnectionStatus("connecting");
    setError(null);
    const socket = getSocket();
    if (socket.connected) {
      setConnectionStatus("connected");
      return;
    }
    socket.connect();
    connectTimer.current = setTimeout(() => {
      if (!getSocket().connected) setConnectionStatus("offline");
    }, 5000);
  }, []);

  const value = useMemo(
    () => ({
      connected,
      connectionStatus,
      reconnecting,
      room,
      playerId,
      error,
      setError,
      privateBluff,
      createRoom,
      joinRoom,
      leaveRoom,
      emit,
      retryReconnect,
      retryConnect,
    }),
    [
      connected,
      connectionStatus,
      reconnecting,
      room,
      playerId,
      error,
      privateBluff,
      createRoom,
      joinRoom,
      leaveRoom,
      emit,
      retryReconnect,
      retryConnect,
    ]
  );

  return (
    <GameSocketContext.Provider value={value}>
      {children}
    </GameSocketContext.Provider>
  );
}

export function useGameSocket(): GameSocketValue {
  const ctx = useContext(GameSocketContext);
  if (!ctx) {
    throw new Error("useGameSocket must be used within SocketProvider");
  }
  return ctx;
}
