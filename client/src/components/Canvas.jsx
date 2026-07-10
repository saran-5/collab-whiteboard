import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

/**
 * The drawing surface. Owns the raw canvas + rendering logic.
 * Drawing state (tool/color/size) is passed down as props from the parent.
 * Exposes imperative methods (clear, undo, exportPNG, replay) via ref.
 */
const Canvas = forwardRef(function Canvas(
  { tool, color, brushSize, onLocalStroke, onCursorMove, remoteCursors },
  ref
) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef(null);
  const historyRef = useRef([]); // all strokes drawn so far, for redraw/undo
  const [, forceRender] = useState(0);

  // Resize canvas to fill its container, preserving existing drawing.
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const prevImage = canvas.width && canvas.height ? canvas.toDataURL() : null;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    canvas.style.width = `${parent.clientWidth}px`;
    canvas.style.height = `${parent.clientHeight}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    redrawAll();
    if (prevImage) {
      // no-op: redrawAll() from history is authoritative; prevImage kept only
      // as a fallback reference in case history is empty on first mount.
    }
  };

  const redrawAll = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    for (const stroke of historyRef.current) {
      drawStroke(stroke);
    }
  };

  const drawStroke = (stroke) => {
    const ctx = ctxRef.current;
    if (!ctx || !stroke || stroke.points.length < 1) return;
    ctx.save();
    ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.beginPath();
    const [first, ...rest] = stroke.points;
    ctx.moveTo(first.x, first.y);
    if (rest.length === 0) {
      // single dot/click
      ctx.lineTo(first.x + 0.1, first.y + 0.1);
    }
    for (const p of rest) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches && e.touches[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    isDrawing.current = true;
    currentStroke.current = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tool,
      color,
      size: brushSize,
      points: [pos],
    };
  };

  const moveDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    onCursorMove?.(pos);

    if (!isDrawing.current || !currentStroke.current) return;
    currentStroke.current.points.push(pos);

    // Render just the new segment for responsiveness, then persist.
    const ctx = ctxRef.current;
    const pts = currentStroke.current.points;
    const prev = pts[pts.length - 2];
    ctx.save();
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.restore();
  };

  const endDraw = () => {
    if (!isDrawing.current || !currentStroke.current) return;
    isDrawing.current = false;
    const stroke = currentStroke.current;
    currentStroke.current = null;
    historyRef.current.push(stroke);
    onLocalStroke?.(stroke);
    forceRender((n) => n + 1);
  };

  useImperativeHandle(ref, () => ({
    clear() {
      historyRef.current = [];
      redrawAll();
    },
    undo() {
      historyRef.current.pop();
      redrawAll();
    },
    applyRemoteStroke(stroke) {
      historyRef.current.push(stroke);
      drawStroke(stroke);
    },
    loadStrokes(strokes) {
      historyRef.current = strokes || [];
      redrawAll();
    },
    exportPNG() {
      return canvasRef.current.toDataURL("image/png");
    },
  }));

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className={`board-canvas ${tool === "eraser" ? "cursor-eraser" : "cursor-pencil"}`}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
      />
      {/* Live cursors of other connected users */}
      {remoteCursors &&
        Object.entries(remoteCursors).map(([id, c]) => (
          <div
            key={id}
            className="remote-cursor"
            style={{ left: c.x, top: c.y, borderColor: c.color }}
          >
            <span className="remote-cursor-label" style={{ background: c.color }}>
              {c.name || "Guest"}
            </span>
          </div>
        ))}
    </div>
  );
});

export default Canvas;
