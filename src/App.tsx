import { useConvexAuth } from "convex/react";
import { AuthScreen } from "./components/AuthScreen";
import { DrawingApp } from "./components/DrawingApp";
import "./styles.css";

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="brutalist-box p-8">
          <div className="loading-bar w-48 h-2 bg-stone-300 border-2 border-black overflow-hidden">
            <div className="h-full bg-black animate-pulse" style={{ width: "60%" }} />
          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest">LOADING CANVAS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <DrawingApp />;
}
