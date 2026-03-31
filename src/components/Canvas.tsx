import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import rough from "roughjs";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  strokeWidth: number;
  tool: string;
}

const COLORS = [
  "#000000", // Black
  "#dc2626", // Red
  "#2563eb", // Blue
  "#16a34a", // Green
  "#ca8a04", // Yellow
  "#9333ea", // Purple
  "#ea580c", // Orange
  "#ffffff", // White
];

const TOOLS = [
  { id: "pencil", icon: "✏", label: "Pencil" },
  { id: "brush", icon: "🖌", label: "Brush" },
  { id: "eraser", icon: "◻", label: "Eraser" },
];

const STROKE_WIDTHS = [2, 4, 8, 16];

interface CanvasProps {
  drawingId: Id<"drawings">;
  onBack: () => void;
}

export function Canvas({ drawingId, onBack }: CanvasProps) {
  const drawing = useQuery(api.drawings.get, { id: drawingId });
  const addStroke = useMutation(api.drawings.addStroke);
  const clearCanvas = useMutation(api.drawings.clearCanvas);
  const undoStroke = useMutation(api.drawings.undoStroke);
  const updateTitle = useMutation(api.drawings.updateTitle);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [showToolbar, setShowToolbar] = useState(true);

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke, rc: ReturnType<typeof rough.canvas>) => {
    if (stroke.points.length < 2) return;

    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = stroke.strokeWidth * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    } else if (stroke.tool === "brush") {
      // Rough.js style for brush
      for (let i = 1; i < stroke.points.length; i++) {
        rc.line(
          stroke.points[i - 1].x,
          stroke.points[i - 1].y,
          stroke.points[i].x,
          stroke.points[i].y,
          {
            stroke: stroke.color,
            strokeWidth: stroke.strokeWidth,
            roughness: 1.5,
          }
        );
      }
    } else {
      // Standard pencil
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !drawing) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rc = rough.canvas(canvas);

    // Clear canvas
    ctx.fillStyle = "#fafaf9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#e7e5e4";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all saved strokes
    drawing.strokes.forEach((stroke: Stroke) => {
      drawStroke(ctx, stroke, rc);
    });

    // Draw current stroke
    if (currentPoints.length > 1) {
      drawStroke(ctx, { points: currentPoints, color, strokeWidth, tool }, rc);
    }
  }, [drawing, currentPoints, color, strokeWidth, tool, drawStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !drawing) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const aspectRatio = drawing.width / drawing.height;

      let displayWidth = containerWidth;
      let displayHeight = containerWidth / aspectRatio;

      if (displayHeight > containerHeight) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * aspectRatio;
      }

      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawing]);

  const startDrawing = useCallback((clientX: number, clientY: number) => {
    const point = getCanvasCoordinates(clientX, clientY);
    if (!point) return;
    setIsDrawing(true);
    setCurrentPoints([point]);
  }, [getCanvasCoordinates]);

  const continueDrawing = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing) return;
    const point = getCanvasCoordinates(clientX, clientY);
    if (!point) return;
    setCurrentPoints((prev) => [...prev, point]);
  }, [isDrawing, getCanvasCoordinates]);

  const endDrawing = useCallback(async () => {
    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    await addStroke({
      id: drawingId,
      stroke: {
        points: currentPoints,
        color: tool === "eraser" ? "#fafaf9" : color,
        strokeWidth,
        tool,
      },
    });

    setIsDrawing(false);
    setCurrentPoints([]);
  }, [isDrawing, currentPoints, addStroke, drawingId, color, strokeWidth, tool]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrawing(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    continueDrawing(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    endDrawing();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    continueDrawing(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    endDrawing();
  };

  const handleClear = async () => {
    if (confirm("Clear the entire canvas?")) {
      await clearCanvas({ id: drawingId });
    }
  };

  const handleUndo = async () => {
    await undoStroke({ id: drawingId });
  };

  const handleTitleSave = async () => {
    if (editTitle.trim()) {
      await updateTitle({ id: drawingId, title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  if (!drawing) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="brutalist-box p-8">
          <p className="font-mono text-sm uppercase tracking-wider">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-stone-200 flex flex-col overflow-hidden">
      <div className="noise-overlay" />

      {/* Header */}
      <header className="border-b-4 border-black bg-white p-2 sm:p-3 flex-shrink-0 z-40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onBack}
              className="brutalist-btn p-2 sm:p-3 text-xs sm:text-sm flex-shrink-0"
            >
              ← Back
            </button>

            {isEditing ? (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                  autoFocus
                  className="brutalist-input px-2 sm:px-3 py-1 sm:py-2 text-sm sm:text-base font-bold w-full max-w-[200px]"
                />
              </div>
            ) : (
              <h1
                className="font-mono text-sm sm:text-lg font-bold uppercase truncate cursor-pointer hover:underline"
                onClick={() => {
                  setEditTitle(drawing.title);
                  setIsEditing(true);
                }}
              >
                {drawing.title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setShowToolbar(!showToolbar)}
              className="brutalist-btn p-2 text-xs sm:hidden"
            >
              {showToolbar ? "▼" : "▲"}
            </button>
            <button onClick={handleUndo} className="brutalist-btn p-2 sm:px-3 sm:py-2 text-xs sm:text-sm">
              ↩ <span className="hidden sm:inline">Undo</span>
            </button>
            <button onClick={handleClear} className="brutalist-btn brutalist-btn-danger p-2 sm:px-3 sm:py-2 text-xs sm:text-sm">
              ✕ <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar - Collapsible on mobile */}
      <div className={`border-b-4 border-black bg-white transition-all duration-200 flex-shrink-0 z-30 ${showToolbar ? 'p-2 sm:p-3' : 'h-0 overflow-hidden p-0 border-b-0'}`}>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Tools */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider mr-1 sm:mr-2 hidden sm:inline">Tool:</span>
            {TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`tool-btn text-sm sm:text-lg w-10 h-10 sm:w-12 sm:h-12 ${tool === t.id ? "active" : ""}`}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-black hidden sm:block" />

          {/* Colors */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider mr-1 sm:mr-2 hidden sm:inline">Color:</span>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`color-swatch w-7 h-7 sm:w-8 sm:h-8 ${color === c ? "active" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="w-px h-8 bg-black hidden sm:block" />

          {/* Stroke Width */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider mr-1 sm:mr-2 hidden sm:inline">Size:</span>
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={`tool-btn w-10 h-10 sm:w-12 sm:h-12 ${strokeWidth === w ? "active" : ""}`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: w * 2, height: w * 2 }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center p-2 sm:p-4 bg-stone-300"
      >
        <div className="brutalist-box-lg bg-white p-1 sm:p-2">
          <canvas
            ref={canvasRef}
            width={drawing.width}
            height={drawing.height}
            className="canvas-container touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-2 sm:py-3 text-center border-t-2 border-stone-400 bg-stone-200 flex-shrink-0">
        <p className="font-mono text-[10px] sm:text-xs text-stone-500 uppercase tracking-wider">
          Requested by @web-user · Built by @clonkbot
        </p>
      </footer>
    </div>
  );
}
