/**
 * In-memory room store.
 *
 * We intentionally avoid any database — all state lives in a plain JS Map
 * for the lifetime of the Node process. If the server restarts, every
 * room's history is gone. This is by design (see project spec).
 *
 * Shape of a room:
 * {
 *   strokes: Array<Stroke>,      // completed + in-progress strokes, replayed to new joiners
 *   users: Map<socketId, { id, name, color }>
 * }
 */

const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      strokes: [],
      users: new Map(),
    });
  }
  return rooms.get(roomId);
}

function addUser(roomId, socketId, user) {
  const room = getOrCreateRoom(roomId);
  room.users.set(socketId, user);
  return room;
}

function removeUser(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.users.delete(socketId);
  // Clean up empty rooms so the Map doesn't grow forever.
  if (room.users.size === 0) {
    rooms.delete(roomId);
  }
  return room;
}

function addStroke(roomId, stroke) {
  const room = getOrCreateRoom(roomId);
  room.strokes.push(stroke);
  // Cap history to avoid unbounded memory growth on very long sessions.
  const MAX_STROKES = 5000;
  if (room.strokes.length > MAX_STROKES) {
    room.strokes.splice(0, room.strokes.length - MAX_STROKES);
  }
}

function clearBoard(roomId) {
  const room = rooms.get(roomId);
  if (room) room.strokes = [];
}

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function getUserCount(roomId) {
  const room = rooms.get(roomId);
  return room ? room.users.size : 0;
}

export default {
  getOrCreateRoom,
  addUser,
  removeUser,
  addStroke,
  clearBoard,
  getRoom,
  getUserCount,
};
