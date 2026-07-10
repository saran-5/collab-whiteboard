import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import roomStore from "./roomStore.js";

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Simple health check — useful for uptime monitors / debugging deploys.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/room/:roomId/count", (req, res) => {
  res.json({ count: roomStore.getUserCount(req.params.roomId) });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
  maxHttpBufferSize: 5e6, // allow slightly larger payloads (batched points)
});

io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("join-room", ({ roomId, name, color }) => {
    if (!roomId) return;
    currentRoom = roomId;
    socket.join(roomId);

    const user = { id: socket.id, name: name || "Guest", color: color || "#4f46e5" };
    roomStore.addUser(roomId, socket.id, user);

    // Send the joining client the full existing drawing + current users.
    const room = roomStore.getRoom(roomId);
    socket.emit("room-state", {
      strokes: room.strokes,
      users: Array.from(room.users.values()),
    });

    // Let everyone else know someone joined + updated user count.
    socket.to(roomId).emit("user-joined", user);
    io.to(roomId).emit("user-count", roomStore.getUserCount(roomId));
  });

  // A stroke is a full path (array of points + style). Broadcast to room instantly.
  socket.on("draw-stroke", (stroke) => {
    if (!currentRoom) return;
    roomStore.addStroke(currentRoom, stroke);
    socket.to(currentRoom).emit("draw-stroke", stroke);
  });

  // Live in-progress point streaming for smoother real-time feel between peers.
  socket.on("draw-point", (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("draw-point", data);
  });

  socket.on("clear-board", () => {
    if (!currentRoom) return;
    roomStore.clearBoard(currentRoom);
    io.to(currentRoom).emit("clear-board");
  });

  socket.on("cursor-move", (pos) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("cursor-move", { id: socket.id, ...pos });
  });

  socket.on("disconnect", () => {
    if (!currentRoom) return;
    roomStore.removeUser(currentRoom, socket.id);
    socket.to(currentRoom).emit("user-left", socket.id);
    io.to(currentRoom).emit("user-count", roomStore.getUserCount(currentRoom));
  });
});

server.listen(PORT, () => {
  console.log(`Whiteboard server listening on http://localhost:${PORT}`);
});
