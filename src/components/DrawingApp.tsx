import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Canvas } from "./Canvas";

export function DrawingApp() {
  const { signOut } = useAuthActions();
  const drawings = useQuery(api.drawings.list);
  const createDrawing = useMutation(api.drawings.create);
  const deleteDrawing = useMutation(api.drawings.remove);

  const [activeDrawingId, setActiveDrawingId] = useState<Id<"drawings"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const id = await createDrawing({
        title: `Drawing ${(drawings?.length || 0) + 1}`,
        width: 1920,
        height: 1080,
      });
      setActiveDrawingId(id);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: Id<"drawings">, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this drawing permanently?")) {
      await deleteDrawing({ id });
    }
  };

  if (activeDrawingId) {
    return (
      <Canvas
        drawingId={activeDrawingId}
        onBack={() => setActiveDrawingId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 grid-pattern flex flex-col">
      <div className="noise-overlay" />

      {/* Header */}
      <header className="border-b-4 border-black bg-white p-3 sm:p-4 md:p-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="brutalist-box p-2 sm:p-3 bg-black text-white flex-shrink-0">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6">
                <rect x="15" y="15" width="70" height="70" />
                <line x1="30" y1="60" x2="45" y2="35" />
                <line x1="45" y1="35" x2="55" y2="50" />
                <line x1="55" y1="50" x2="70" y2="30" />
              </svg>
            </div>
            <div>
              <h1 className="font-mono text-lg sm:text-xl md:text-2xl font-extrabold uppercase tracking-tight">
                Brutal Canvas
              </h1>
              <p className="font-mono text-[10px] sm:text-xs text-stone-500 uppercase tracking-wider">
                {drawings?.length || 0} Drawings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="brutalist-btn brutalist-btn-primary px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50 flex-1 sm:flex-initial"
            >
              {isCreating ? "Creating..." : "+ New Drawing"}
            </button>
            <button
              onClick={() => signOut()}
              className="brutalist-btn px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {drawings === undefined ? (
            <div className="flex items-center justify-center h-64">
              <div className="brutalist-box p-6 sm:p-8">
                <p className="font-mono text-xs sm:text-sm uppercase tracking-wider">Loading drawings...</p>
              </div>
            </div>
          ) : drawings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 sm:h-96 animate-slide-up">
              <div className="brutalist-box-lg p-8 sm:p-12 text-center max-w-md">
                <div className="text-5xl sm:text-6xl mb-4">□</div>
                <h2 className="font-mono text-lg sm:text-xl font-bold uppercase mb-2">Empty Canvas</h2>
                <p className="font-mono text-xs sm:text-sm text-stone-600 mb-6">
                  Start creating something brutal and beautiful
                </p>
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="brutalist-btn brutalist-btn-primary px-6 sm:px-8 py-3 sm:py-4 text-sm"
                >
                  Create First Drawing
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {drawings.map((drawing: typeof drawings[number], index: number) => (
                <div
                  key={drawing._id}
                  className="drawing-card group animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => setActiveDrawingId(drawing._id)}
                >
                  <div className="h-full flex flex-col">
                    {/* Preview Area */}
                    <div className="flex-1 bg-stone-50 relative overflow-hidden p-4">
                      {drawing.strokes.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-mono text-stone-300 text-4xl sm:text-6xl">∅</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-mono text-stone-400 text-xs sm:text-sm uppercase">
                            {drawing.strokes.length} strokes
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info Bar */}
                    <div className="p-3 sm:p-4 border-t-3 border-black bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-mono text-xs sm:text-sm font-bold uppercase truncate">
                            {drawing.title}
                          </h3>
                          <p className="font-mono text-[10px] text-stone-500">
                            {new Date(drawing.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDelete(drawing._id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-2 hover:bg-red-100"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l12 12M6 18L18 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* New Drawing Card */}
              <div
                className="drawing-card border-dashed flex items-center justify-center cursor-pointer hover:bg-stone-50"
                onClick={handleCreate}
              >
                <div className="text-center p-4">
                  <div className="text-3xl sm:text-4xl mb-2">+</div>
                  <p className="font-mono text-xs uppercase tracking-wider">New Drawing</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 sm:py-6 text-center border-t-2 border-stone-300 bg-stone-100">
        <p className="font-mono text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">
          Requested by @web-user · Built by @clonkbot
        </p>
      </footer>
    </div>
  );
}
