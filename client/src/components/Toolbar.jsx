const SWATCHES = ["#111827", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

export default function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  onClear,
  onUndo,
  onDownload,
  darkMode,
  setDarkMode,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button
          className={`tool-btn ${tool === "pencil" ? "active" : ""}`}
          onClick={() => setTool("pencil")}
          title="Pencil"
          aria-label="Pencil"
        >
          ✏️
        </button>
        <button
          className={`tool-btn ${tool === "eraser" ? "active" : ""}`}
          onClick={() => setTool("eraser")}
          title="Eraser"
          aria-label="Eraser"
        >
          🧽
        </button>
      </div>

      <div className="toolbar-group">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="color-picker"
          title="Pick a color"
        />
        <div className="swatches">
          {SWATCHES.map((c) => (
            <button
              key={c}
              className={`swatch ${color === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-group brush-group">
        <label className="brush-label" htmlFor="brush-size">
          Size
        </label>
        <input
          id="brush-size"
          type="range"
          min={1}
          max={40}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="brush-slider"
        />
        <span className="brush-preview" style={{ width: brushSize, height: brushSize }} />
      </div>

      <div className="toolbar-group">
        <button className="tool-btn" onClick={onUndo} title="Undo (local)" aria-label="Undo">
          ↩️
        </button>
        <button className="tool-btn" onClick={onClear} title="Clear board" aria-label="Clear board">
          🗑️
        </button>
        <button className="tool-btn" onClick={onDownload} title="Download PNG" aria-label="Download PNG">
          ⬇️
        </button>
        <button
          className="tool-btn"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </div>
  );
}
