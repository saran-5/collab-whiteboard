import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// In dev, Vite proxies /socket.io to the backend (see vite.config.js).
// In production, set VITE_SERVER_URL to the deployed backend origin.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined;

/**
 * Establishes a single socket connection for the lifetime of the room view
 * and exposes helpers + live state (user count, live cursors).
 */
export default function useSocket(roomId, userMeta) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [cursors, setCursors] = useState({}); // { socketId: { x, y, color, name } }

  useEffect(() => {
    if (!roomId) return;

    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", { roomId, ...userMeta });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("user-count", (count) => setUserCount(count));

    socket.on("user-left", (id) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socket.on("cursor-move", ({ id, x, y, color, name }) => {
      setCursors((prev) => ({ ...prev, [id]: { x, y, color, name } }));
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return { socketRef, connected, userCount, cursors, setCursors };
}
