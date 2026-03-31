import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await signIn("password", formData);
    } catch (err) {
      setError(flow === "signIn" ? "Invalid credentials" : "Could not create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymous = async () => {
    setIsLoading(true);
    try {
      await signIn("anonymous");
    } catch (err) {
      setError("Could not sign in anonymously");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 grid-pattern flex flex-col">
      <div className="noise-overlay" />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo/Title */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-block brutalist-box-lg p-4 sm:p-6 bg-black text-white mb-4 sm:mb-6">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4">
                <rect x="10" y="10" width="80" height="80" />
                <line x1="25" y1="70" x2="40" y2="30" />
                <line x1="40" y1="30" x2="60" y2="50" />
                <line x1="60" y1="50" x2="75" y2="25" />
              </svg>
            </div>
            <h1 className="font-mono text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter uppercase">
              BRUTAL<br />CANVAS
            </h1>
            <p className="mt-2 sm:mt-3 font-mono text-xs sm:text-sm text-stone-600 uppercase tracking-widest">
              Raw. Unfiltered. Creative.
            </p>
          </div>

          {/* Auth Form */}
          <div className="brutalist-box-lg p-4 sm:p-6 md:p-8 bg-white">
            <h2 className="font-mono text-lg sm:text-xl font-bold uppercase mb-4 sm:mb-6 border-b-4 border-black pb-2">
              {flow === "signIn" ? "→ Sign In" : "→ Create Account"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="brutalist-input w-full px-4 py-3 text-sm sm:text-base"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="brutalist-input w-full px-4 py-3 text-sm sm:text-base"
                  placeholder="••••••••"
                />
              </div>

              <input name="flow" type="hidden" value={flow} />

              {error && (
                <div className="bg-red-100 border-3 border-red-600 p-3 font-mono text-xs sm:text-sm text-red-800 uppercase">
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="brutalist-btn brutalist-btn-primary w-full py-3 sm:py-4 text-sm sm:text-base disabled:opacity-50"
              >
                {isLoading ? "Loading..." : flow === "signIn" ? "Enter Canvas →" : "Create & Enter →"}
              </button>
            </form>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-stone-200">
              <button
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
                className="font-mono text-xs sm:text-sm uppercase tracking-wider hover:underline underline-offset-4 w-full text-left"
              >
                {flow === "signIn" ? "↳ Need an account? Sign up" : "↳ Have an account? Sign in"}
              </button>
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-4 border-black">
              <button
                onClick={handleAnonymous}
                disabled={isLoading}
                className="brutalist-btn w-full py-3 text-xs sm:text-sm disabled:opacity-50"
              >
                Skip → Continue as Guest
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="mt-6 sm:mt-8 flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 sm:w-4 sm:h-4 bg-black"
                style={{
                  transform: `rotate(${i * 15}deg)`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 sm:py-6 text-center border-t-2 border-stone-300">
        <p className="font-mono text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">
          Requested by @web-user · Built by @clonkbot
        </p>
      </footer>
    </div>
  );
}
