import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Canvas from "./components/Canvas.jsx";
import Toolbar from "./components/Toolbar.jsx";
import AdBanner from "./components/AdBanner.jsx";
import RoomHeader from "./components/RoomHeader.jsx";
import useSocket from "./hooks/useSocket.js";

const NAMES = ["Fox", "Owl", "Otter", "Panda", "Lynx", "Wren", "Hare", "Finch"];
const CURSOR_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899"];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export default function App() {
  const { roomId } = useParams();
  const canvasRef = useRef(null);

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#111827");
  const [brushSize, setBrushSize] = useState(6);
  const [darkMode, setDarkMode] = useState(false);

  // Stable per-tab identity for cursor labels — not a login, just a display nicety.
  const userMeta = useMemo(
    () => ({ name: randomFrom(NAMES), color: randomFrom(CURSOR_COLORS) }),
    []
  );

  const { socketRef, connected, userCount, cursors } = useSocket(roomId, userMeta);

  // Wire up incoming socket events to the canvas.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleRoomState = ({ strokes }) => {
      canvasRef.current?.loadStrokes(strokes);
    };
    const handleRemoteStroke = (stroke) => {
      canvasRef.current?.applyRemoteStroke(stroke);
    };
    const handleClear = () => {
      canvasRef.current?.clear();
    };

    socket.on("room-state", handleRoomState);
    socket.on("draw-stroke", handleRemoteStroke);
    socket.on("clear-board", handleClear);

    return () => {
      socket.off("room-state", handleRoomState);
      socket.off("draw-stroke", handleRemoteStroke);
      socket.off("clear-board", handleClear);
    };
  }, [socketRef, connected]);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleLocalStroke = (stroke) => {
    socketRef.current?.emit("draw-stroke", stroke);
  };

  const handleCursorMove = (pos) => {
    socketRef.current?.emit("cursor-move", { ...pos, ...userMeta });
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    socketRef.current?.emit("clear-board");
  };

  const handleUndo = () => {
    // Undo is local-only per spec: it removes the last stroke from this
    // client's view/history but does not notify other clients.
    canvasRef.current?.undo();
  };

  const handleDownload = () => {
    const dataUrl = canvasRef.current?.exportPNG();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `collabboard-${roomId}.png`;
    link.click();
  };

  return (
    <div className="app-shell">
      <RoomHeader roomId={roomId} userCount={userCount} connected={connected} />

      <main className="board-area">
        <Canvas
          ref={canvasRef}
          tool={tool}
          color={color}
          brushSize={brushSize}
          onLocalStroke={handleLocalStroke}
          onCursorMove={handleCursorMove}
          remoteCursors={cursors}
        />
      </main>

      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        onClear={handleClear}
        onUndo={handleUndo}
        onDownload={handleDownload}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <AdBanner />
    </div>
  );
}
