import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldCheck, Lock, Mail, KeyRound, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";

export function Login() {
  const { admin, setup, signIn, transportError, retry } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  /**
   * Where signing in should land.
   *
   * Computed *before* the redirect below, and used by it. That ordering is the
   * whole fix: this guard used to send everyone to `/templates` unconditionally,
   * and because it runs on every render it fired the moment `signIn` set the
   * admin — overriding the `navigate(destination)` on the next line. So the page
   * an admin was actually trying to reach was always discarded, and every deep
   * link into the panel bounced them to the templates list instead.
   *
   * The fallback is the dashboard now that one exists. It was `/templates`
   * because that was the only screen built — so an operator signing in landed
   * on the section library rather than on the queue of people waiting for a
   * decision. Deep links are unaffected: `from` still wins.
   */
  const destination =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (admin) return <Navigate to={destination} replace />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await signIn({
        ...(email.trim() ? { email: email.trim() } : {}),
        password,
        ...(token ? { token } : {}),
      });
      // No `navigate()` here. `signIn` sets the admin, which re-renders this
      // component into the `<Navigate to={destination}>` above. Doing both is
      // what made the destination unreachable: the two raced, and the guard won.
    } catch (cause: any) {
      let message = "Sign-in failed";
      if (cause instanceof ApiError) {
        message = typeof cause.message === "string" ? cause.message : "Sign-in failed";
      } else if (cause instanceof Error) {
        message = typeof cause.message === "string" ? cause.message : "Sign-in failed";
      } else if (typeof cause === "string") {
        message = cause;
      } else if (cause && typeof cause === "object") {
        message =
          typeof cause.message === "string"
            ? cause.message
            : typeof cause.error === "string"
            ? cause.error
            : "Sign-in failed. Please check your credentials.";
      }

      const isRateLimit =
        (cause instanceof ApiError && cause.status === 429) ||
        message.toLowerCase().includes("too many") ||
        message.toLowerCase().includes("429");

      if (isRateLimit) {
        /**
         * The wait the API actually enforces, from its `Retry-After` header.
         *
         * This used to hardcode 300 seconds and tell the operator "try again in
         * 5:00 minutes". The API's admin-login bucket is five attempts per
         * *fifteen* minutes, so the countdown expired, the button re-enabled,
         * the next attempt was refused again, and the timer restarted — which
         * reads as the panel being broken rather than as a lockout with ten
         * minutes left on it.
         */
        const wait =
          cause instanceof ApiError && typeof cause.retryAfterSeconds === "number"
            ? cause.retryAfterSeconds
            : null;
        setRetryCountdown(wait);
        setError(
          wait
            ? `Too many sign-in attempts. Try again in ${formatCountdown(wait)}.`
            : "Too many sign-in attempts. Try again shortly.",
        );
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
    <main className="relative flex min-h-screen items-center justify-center bg-night px-4 py-12 text-chalk font-sans selection:bg-accent selection:text-white overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-white/70 via-white/40 to-lavender-deep/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-white/40 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-xl border border-night-line bg-white p-8 sm:p-10 backdrop-blur-2xl shadow-[0_30px_70px_-30px_rgba(38,37,92,0.55)] ring-1 ring-chalk/5">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold tracking-wider text-blue-600 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>XITE Super Admin</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-chalk">
              Welcome Back
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-chalk-dim font-medium">
              Enter your admin credentials to access the control panel.
            </p>
          </div>

          {/* The API could not be reached at all.
              Shown above the form and instead of the setup banners, because
              none of those diagnoses can be trusted when nothing answered.
              Without this, an API outage looked exactly like a wrong password. */}
          {transportError ? (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Cannot reach the API</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-chalk-dim">{transportError}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-3 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-700 transition-colors hover:bg-amber-100 cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : null}

          {/* Setup Warnings */}
          {!transportError && setup && !setup.configured ? (
            <Setup
              title="Not configured"
              body="ADMIN_SESSION_SECRET is not set on the API, or it matches SESSION_SECRET."
              steps={[
                "openssl rand -base64 32",
                "Set ADMIN_SESSION_SECRET on API",
                "Redeploy service",
              ]}
            />
          ) : !transportError && setup && !setup.hasAccounts ? (
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
              <label className="block text-xs font-bold uppercase tracking-wider text-chalk-dim mb-2">
                Admin Email (Optional)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-chalk-dim">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  placeholder="admin@xite.co.in"
                  className="w-full rounded-lg border border-night-line bg-night py-3.5 pl-10 pr-4 text-sm font-medium text-chalk placeholder-chalk-dim outline-none transition-all focus:border-chalk focus:ring-2 focus:ring-chalk/15"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-chalk-dim mb-2">
                Master Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-chalk-dim">
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
                  className="w-full rounded-lg border border-night-line bg-night py-3.5 pl-10 pr-11 text-sm font-medium text-chalk placeholder-chalk-dim outline-none transition-all focus:border-chalk focus:ring-2 focus:ring-chalk/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-chalk-dim hover:text-chalk-dim transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {needsToken ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-chalk-dim mb-2">
                  Authenticator Code
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-chalk-dim">
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
                    className="w-full rounded-lg border border-night-line bg-night py-3.5 pl-10 pr-4 text-center font-mono text-lg font-bold tracking-[0.3em] text-blue-600 outline-none transition-all focus:border-chalk focus:ring-2 focus:ring-chalk/15"
                  />
                </div>
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>
                  {retryCountdown
                    ? `Too many sign-in attempts. Try again in ${formatCountdown(retryCountdown)}.`
                    : error}
                </span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={pending || retryCountdown !== null}
              className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3.5 text-sm font-bold text-white shadow-lg shadow-chalk/20 transition-all duration-200 hover:bg-accent-hover hover:shadow-chalk/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {pending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-night-line border-t-night" />
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
        <p className="mt-8 text-center text-xs text-chalk-dim font-medium">
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
    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
        <Sparkles className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-chalk-dim">{body}</p>
      <ol className="mt-3 space-y-1.5 border-t border-amber-200 pt-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2 text-xs text-chalk-dim">
            <span className="font-bold text-amber-600">{index + 1}.</span>
            <span className="font-mono text-[11px] text-chalk-dim">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
