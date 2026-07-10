import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import Landing from "./Landing.jsx";
import "./styles.css";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:roomId" element={<App />} />
        {/* Any unknown path -> a fresh random room, so a bare link always works */}
        <Route path="*" element={<Navigate to={`/room/${generateRoomId()}`} replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
