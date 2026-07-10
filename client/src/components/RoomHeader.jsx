import { useState } from "react";

export default function RoomHeader({ roomId, userCount, connected }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API may be unavailable (e.g. non-HTTPS); fail silently
    }
  };

  return (
    <header className="room-header">
      <div className="room-header-left">
        <span className="brand">
          Collab<span className="accent">Board</span>
        </span>
        <span className="room-id-badge">Room: {roomId}</span>
      </div>

      <div className="room-header-right">
        <span className={`status-dot ${connected ? "online" : "offline"}`} />
        <span className="user-count" title="Connected users">
          👥 {userCount}
        </span>
        <button className="btn btn-secondary btn-small" onClick={copyLink}>
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </header>
  );
}
