import { useState } from "react";
import { useNavigate } from "react-router-dom";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function Landing() {
  const [roomInput, setRoomInput] = useState("");
  const navigate = useNavigate();

  const createRoom = () => {
    navigate(`/room/${generateRoomId()}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    const id = roomInput.trim().toUpperCase();
    if (id) navigate(`/room/${id}`);
  };

  return (
    <div className="landing">
      <div className="landing-card">
        <h1 className="landing-title">
          Collab<span className="accent">Board</span>
        </h1>
        <p className="landing-subtitle">
          A simple real-time whiteboard. No sign up. Just draw together.
        </p>

        <button className="btn btn-primary btn-large" onClick={createRoom}>
          Create a New Room
        </button>

        <div className="landing-divider">
          <span>or</span>
        </div>

        <form className="landing-join" onSubmit={joinRoom}>
          <input
            type="text"
            placeholder="Enter room code (e.g. ABCD1234)"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="landing-input"
            maxLength={12}
          />
          <button type="submit" className="btn btn-secondary" disabled={!roomInput.trim()}>
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
