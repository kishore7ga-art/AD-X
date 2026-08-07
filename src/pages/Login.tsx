import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";

export function Login() {
  const { admin, setup, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState("2008");
  const [token, setToken] = useState("");
  const [needsToken, setNeedsToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;
    const timer = setInterval(() => {
      setRetryCountdown((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (admin) return <Navigate to="/templates" replace />;

  const destination =
    (location.state as { from?: string } | null)?.from ?? "/templates";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await signIn({ password, ...(token ? { token } : {}) });
      navigate(destination, { replace: true });
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : "Sign-in failed";

      const isRateLimit =
        (cause instanceof ApiError && cause.status === 429) ||
        message.toLowerCase().includes("too many") ||
        message.toLowerCase().includes("429");

      if (isRateLimit) {
        setRetryCountdown(300);
        setError("Too many login attempts. Please try again in 5:00 minutes.");
      } else if (message.includes("6-digit")) {
        setNeedsToken(true);
        setError("Enter the code from your authenticator app.");
      } else {
        setError(message);
      }
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#07090e] px-4 py-12 text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 sm:p-10 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-white/5">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold tracking-wider text-blue-400 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>XITE Super Admin</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome Back
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">
              Enter your master password to access the XITE control panel.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-mono text-amber-300 font-bold">
              🔑 Master Password: <span className="text-white underline">2008</span>
            </div>
          </div>

          {/* Setup Warnings */}
          {setup && !setup.configured ? (
            <Setup
              title="Not configured"
              body="ADMIN_SESSION_SECRET is not set on the API, or it matches SESSION_SECRET."
              steps={[
                "openssl rand -base64 32",
                "Set ADMIN_SESSION_SECRET on API",
                "Redeploy service",
              ]}
            />
          ) : setup && !setup.hasAccounts ? (
            <Setup
              title="No account yet"
              body="No Super Admin exists in the database."
              steps={[
                "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD",
                "Redeploy — account created at boot",
                "Sign in with your master password",
              ]}
            />
          ) : null}

          {/* Form */}
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Master Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter password..."
                  autoFocus
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3.5 pl-10 pr-11 text-sm font-medium text-white placeholder-slate-600 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {needsToken ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Authenticator Code
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={token}
                    onChange={(event) =>
                      setToken(event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="000000"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3.5 pl-10 pr-4 text-center font-mono text-lg font-bold tracking-[0.3em] text-blue-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 font-medium"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>
                  {retryCountdown
                    ? `Too many login attempts. Please try again in ${formatCountdown(retryCountdown)} minutes.`
                    : error}
                </span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={pending || retryCountdown !== null}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Verifying...
                </span>
              ) : retryCountdown ? (
                `Try again in ${formatCountdown(retryCountdown)}`
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-600 font-medium">
          XITE SaaS Platform &copy; {new Date().getFullYear()} &bull; Secure Control Room
        </p>
      </div>
    </main>
  );
}

function Setup({
  title,
  body,
  steps,
}: {
  title: string;
  body: string;
  steps: string[];
}) {
  return (
    <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
        <Sparkles className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-300">{body}</p>
      <ol className="mt-3 space-y-1.5 border-t border-amber-500/20 pt-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2 text-xs text-slate-400">
            <span className="font-bold text-amber-400">{index + 1}.</span>
            <span className="font-mono text-[11px] text-slate-300">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
