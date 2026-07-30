import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";

/**
 * Super Admin sign-in, ported from xite-F's `AdminLoginForm`.
 *
 * Password only. The email is still the account's identity in the database, but
 * it is not a credential to type — the backend finds the account from the
 * password. Which also means the password is the whole credential, so the
 * endpoint's rate limit and `admin.mjs enrol` are what stand behind it.
 *
 * The progressive second factor is the part worth preserving exactly. The code
 * field appears only once the backend asks for it: an account that has not enrolled
 * should not be shown a box it cannot fill, and one that has should not be told
 * "wrong password" when the password was right — that message sends people off to
 * reset a password that was fine.
 *
 * The backend distinguishes the two by answering 401 with "A 6-digit code is
 * required" rather than the generic message, which is the only place it
 * deliberately leaks that a password was correct.
 */
export function Login() {
  const { admin, setup, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [needsToken, setNeedsToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Already in. Bounce rather than offer a form that would be a no-op.
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

      if (message.includes("6-digit")) {
        setNeedsToken(true);
        setError("Enter the code from your authenticator app.");
      } else {
        setError(message);
      }
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-night px-5 py-12">
      <div className="w-full max-w-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-chalk-dim/50">
          XITE
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-chalk">
          Super Admin
        </h1>

        {/*
          Three different problems, and only one of them is fixed by typing the
          password again. Same three states xite-F's /admin route distinguishes.
        */}
        {setup && !setup.configured ? (
          <Setup
            title="Not configured"
            body="ADMIN_SESSION_SECRET is not set on the API, or it matches SESSION_SECRET. The panel refuses to run on the app's own signing key."
            steps={[
              "openssl rand -base64 32",
              "Set ADMIN_SESSION_SECRET on the API service",
              "Redeploy",
            ]}
          />
        ) : setup && !setup.hasAccounts ? (
          <Setup
            title="No account yet"
            body="The panel is reachable but no Super Admin exists. There is deliberately no way to register — an account has to be put there by somebody with access to the deployment."
            steps={[
              "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD",
              "Redeploy — the account is created once, at boot",
              "Sign in, then remove both variables",
            ]}
          />
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-chalk-dim">
            Accounts are created from a terminal, not here.
          </p>
        )}

        <form onSubmit={submit} className="mt-9 space-y-5">
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              className={INPUT}
            />
          </Field>

          {needsToken ? (
            <Field label="Authenticator code">
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={token}
                onChange={(event) =>
                  setToken(event.target.value.replace(/\D/g, ""))
                }
                autoComplete="one-time-code"
                autoFocus
                required
                className={`${INPUT} text-center font-mono text-lg tracking-[0.4em]`}
              />
            </Field>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-night transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

const INPUT =
  "mt-2 w-full rounded-lg border border-night-line bg-night-raised px-4 py-3 text-sm text-chalk outline-none transition focus:border-accent";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-chalk-dim/60">
        {label}
      </span>
      {children}
    </label>
  );
}

/** What to do about it, rather than what went wrong. */
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
    <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
      <p className="text-sm font-semibold text-amber-300">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-chalk-dim">{body}</p>
      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-chalk-dim">
            <span className="shrink-0 text-[13px] tabular-nums text-amber-300/70">
              {index + 1}.
            </span>
            <span className="font-mono text-[12px] leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
