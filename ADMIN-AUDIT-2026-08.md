# Admin panel — end-to-end audit, August 2026

What was wrong with the admin panel and the API behind it, why, and what was
done. Written for whoever next changes this code, so the reasoning behind the
current shape survives without reading the commits.

Ten faults. Nine share a shape: **the operator was told something had happened,
and it had not.**

---

## Summary

| # | Reported/observed as | Actual cause |
| :-- | :--- | :--- |
| 01 | Sections "saved" but tenants never see them | The library list merged one browser's localStorage; nothing synced it |
| 02 | Deep links always land on Templates | A render-time redirect raced the intended `navigate()` and won |
| 03 | Panel stops working, no explanation | An expired session was never detected; every 401 handled per-screen |
| 04 | "Logged out" during an API outage | Transport failure and signed-out were the same `catch {}` |
| 05 | Lockout timer expires but login still refused | UI hardcoded 5 minutes against a 15-minute bucket |
| 06 | A deployed fix changed nothing | Seven admin routes existed twice; line number decided which answered |
| 07 | Delete sometimes permanent, saves duplicated | Three "bypass" endpoints whose bypass premise was already gone |
| 08 | Container cannot resolve internal hostnames | `dns.setServers()` at import replaced the process-wide resolver |
| 09 | Requests hang during a database outage | Three inline reconnects; every other route waited out the buffer |
| 10 | Changing `.env.production` has no effect | The Dockerfile's `ENV` beats an `.env` file in Vite |

---

## 01. The phantom library

When saving a section failed, `SectionAddStudio` wrote it into
`localStorage.xite_admin_local_templates` and told the operator:

> Save failed: … — The section was saved locally. It will sync to DB when the
> server is fixed.

**Nothing synced it.** No code in this repository ever read that key and posted
it. And `Templates.fetchTemplates()` *merged* that key into the list it renders,
so the section appeared in the library with a plausible id, indistinguishable
from a real one. On an API failure the whole list fell back to
`xite_admin_templates_cache` — a stale snapshot of itself, presented as live.

So an admin could author a section, be told it was saved, watch it appear in the
library, and have no tenant ever see it, because the editor reads the database.
A second admin, or the same admin on another machine, saw a different library.

A cache that only one person can see, that nothing reconciles, and that is
presented as the shared library, is worse than an error message.

**Fix.** Both keys removed. A save that did not save is an error, worded so the
author knows to copy their code before navigating away. An empty list now
distinguishes "there are none" from "I could not reach the API", with a retry.

---

## 02. Signing in discarded the destination

`ProtectedRoute` redirects to `/login` with the attempted path in
`location.state`, and `Login` computed a `destination` from it and called
`navigate(destination)` after signing in.

The line above it read:

```tsx
if (admin) return <Navigate to="/templates" replace />;
```

That guard runs on **every render**, so it fired the moment `signIn` set the
admin — and won the race against the `navigate()` below. Every deep link into
the panel landed on the templates list.

**Fix.** `destination` is computed before the guard and used by it. The competing
`navigate()` is gone; two navigations racing is what caused the bug.

---

## 03. An expired session left the operator on a dead panel

The admin cookie lasts eight hours, so it expires mid-session. Nothing noticed:
`ProtectedRoute` resolves the session once on mount and never again. Every button
then failed with its own unrelated message — "Failed to load templates",
"Failed to delete template" — and nothing ever suggested signing in again.

`isUnauthorized` was exported for exactly this and **used nowhere**.

**Fix.** A 401 is a fact about the tab, not a per-screen error. `client.ts` calls
a handler registered by `AuthProvider` on any 401, which clears the admin;
`ProtectedRoute` then redirects, preserving the current path.

The login endpoints are excluded: a wrong password is also a 401, there is no
session to end, and clearing state would pull the form out from under the person
typing in it.

---

## 04. An API outage looked exactly like being logged out

`GET /admin/me` answers **200 with `{admin: null}`** when nobody is signed in —
being signed out is not an error. So the only way that call throws is a genuine
transport failure: the API is down, DNS is wrong, or this origin is missing from
the API's `CORS_ORIGINS`.

`AuthContext` caught all three into `catch {}` and treated them as "signed out",
bouncing the operator to a login form that could not possibly work. The status
probe defaulted to `{configured: true, hasAccounts: true}` on failure, which hid
the setup banners describing exactly those faults.

**Fix.** Transport failure is its own state (`transportError`), named on the
login screen — including the origin that would have to be allowed — with a retry
button. The status probe is only attempted once the first call has proved the API
reachable, and an unanswered status renders no banner rather than a confident
wrong one.

---

## 05. A lockout timer that expired before the lockout did

The panel hardcoded a 300-second countdown and said "try again in 5:00 minutes".
The API's `adminLogin` bucket is five attempts per **fifteen** minutes. So the
timer expired, the button re-enabled, the next attempt was refused, and the
countdown restarted — a lockout that reads as a broken panel.

**Fix.** `retryAfterSeconds()` in the API computes the real wait from the
timestamps the limiter already keeps, and the admin-login 429 sends it as
`Retry-After`. `ApiError` carries it; the panel renders it.

`Access-Control-Expose-Headers: Retry-After` went with it — a cross-origin
caller cannot read a response header that is not named there, however carefully
the server set it, and this panel is on a different origin from its API.

---

## 06. Two parallel admin APIs, and line number decided which won

Seven routes existed twice: once on `adminRouter`, and once as a top-level
`app.get`/`app.post` registered at four or five path aliases each.

Express matches in registration order. `/status` and `/me` sat **above**
`app.use("/api/v1/admin", adminRouter)`, so they shadowed the router entirely for
the canonical prefix; the other five were shadowed *by* it.

This is not a theoretical hazard. Tightening `adminRouter.get("/status")` — to
stop it fabricating `{configured: true, email: "admin@xite.co.in"}` on a failed
lookup, and to stop it returning bootstrap state to anonymous callers — was
written, compiled and deployed, and **changed nothing**, because the copy at the
top of the file was the one answering.

**Fix.** One implementation. Nothing was lost: a path-rewriting middleware
already maps every bare alias (`/status`, `/templates`, `/users`, …) onto
`/api/v1/admin/*`, and four `app.use(…, adminRouter)` mounts cover the prefixed
forms. Verified against a running server — all five spellings of `/status`
answer identically.

`/status` now returns two booleans or an honest 503, and no longer leaks
`bootstrap: {varsSet, lastRun}` to unauthenticated callers.

---

## 07. Three "bypass" endpoints that were not bypasses

`POST /admin/save-section`, `PATCH /admin/update-section/:id` and
`DELETE /admin/delete-section/:id` duplicated the canonical `/templates` routes,
which have audit trails. The panel called both — the shortcut first, then the
canonical one as a "fallback" — on the strength of comments reading
"no strict auth" and "no auth required".

That had stopped being true when `requireAdmin` was added to all three. What
remained:

- A transient failure on the first door produced a **duplicate row** via the
  second, rather than a retry.
- **Delete escalated silently.** A 503 on `delete-section` sent the operator's
  click to `templates/:id?hard=true` — a permanent delete instead of an archive.
- `delete-section` fell back to `Template.findOneAndDelete({ name: id })` when
  the id was not an ObjectId, so a stale client passing a *name* deleted the
  template with that name. The comment said this was for "a name-based id from
  localStorage" — the same client-side cache removed in finding 01.

**Fix.** All three endpoints deleted; all three client-side cascades removed.
`.catch(() => null)` also removed from archive and delete-all, which could fail
against the database and still report success.

---

## 08. A DNS override that replaced the whole process's resolver

`config/db.ts` called this at import time, unconditionally:

```ts
dns.setServers(["8.8.8.8", "1.1.1.1"]);
```

commented as a workaround for one developer's machine failing Atlas SRV lookups.

`setServers` is **process-wide**. It replaces the resolver for every hostname the
service will ever look up, not just Atlas. In a container that is actively
harmful: Docker and Dokploy resolve service names through an embedded DNS server
on the container's own resolver, and 8.8.8.8 has never heard of them. It also
silently routes every DNS query the API makes through Google — a dependency and
a disclosure nobody chose.

**Fix.** `dns.setDefaultResultOrder("ipv4first")` — the actual Node 17 fix, which
changes *ordering* rather than *who answers* — stays and is unconditional. The
resolver override is behind `DNS_SERVERS`, off by default, and warns loudly when
it is on.

---

## 09. Three copies of "the database is down"

Each of the three endpoints in finding 07 carried its own: check `readyState`,
call `mongoose.connect` inline, and on failure return
`"DB reconnect failed: " + err.message`.

Three problems in one pattern:

- It reconnects **from inside a request**, so a burst of traffic during an outage
  opens a burst of handshakes.
- It leaks the driver's message, which names the cluster host and replica-set
  topology, to the caller.
- It was only on the three endpoints somebody happened to be debugging, so every
  other route failed by **hanging** until mongoose's buffer timed out.

**Fix.** Reconnection belongs to the watchdog, which is a single timer. One
readiness gate now *reports* — and it is placed **after** the CORS middleware,
because before it the gate's own 503 reaches the browser as a CORS error, which
is precisely the misdiagnosis it exists to prevent.

The gate distinguishes two states `readyState` reports identically as
"connecting":

- **reconnecting after a working connection** — mongoose buffers, so let it
  through;
- **never connected** — nothing will serve this, so say so now rather than
  making the caller wait out a 15-second selection timeout, per attempt, for
  eight attempts.

`dbServable()` in `config/db.ts` holds that rule.

Verified against a server pointed at a dead port: `/api/health` and
`/openapi.json` stay reachable; every database route answers 503 immediately,
with CORS headers, a `Retry-After`, and a sentence rather than a driver dump.

---

## 10. A config file documented as authoritative and silently ignored

`.env.production` carries a long comment explaining that it is the place to
change the API address for everyone. The Dockerfile set:

```dockerfile
ENV VITE_API_BASE_URL=https://api.webxite.org
```

and a real environment variable **beats an `.env` file in Vite**. So for every
Docker build — which is every deployment — the documented file was dead.

**Fix.** No default in the Dockerfile. `.env.production` is the single source;
build args override it by writing `.env.production.local`, which is the
precedence Vite already defines and `.gitignore` already excludes.

Also: `Shell` linked to `https://api.webxite.org` and `https://webxite.org` as
literals, so in local development the health check, the API docs and the "open
the studio" link all pointed at live production. They read `API_BASE` and
`STUDIO_BASE` now.

And `env.ts` read `import.meta.env.X` unguarded, which throws outside a Vite
build — that is why this repo had no tests.

---

## What the audit found clean

Recorded because "we checked and it was fine" is part of the answer.

- **No secrets in the bundle.** Only two `VITE_*` variables exist, both public
  URLs. The admin session is an httpOnly cookie the API sets; this app never
  holds a token.
- **`.gitignore`** excludes `.env` and `.env.*.local`. The committed
  `.env.development` / `.env.production` hold only hostnames, deliberately.
- **Cookie attributes** are correct for a cross-origin panel: `httpOnly`,
  `SameSite=None` + `Secure` when cross-site, parent domain derived for
  `.webxite.org`.
- **CORS** is an explicit allowlist with credentials, no wildcard, and its
  suffix rule is tested against a *parsed hostname* — so
  `webxite.org.attacker.com` does not pass.
- **Route protection** is server-side on every admin endpoint via
  `requireAdmin`. `ProtectedRoute` is correctly documented as a screen-chooser,
  not a security boundary.
- **SPA routing**: `try_files $uri $uri/ /index.html`. Deep links serve the app.
- **No dead components.** All six shared components are imported and used.
- **No broken imports or API paths.** All 16 paths the panel calls resolve to
  real backend routes.

---

## 11. Four more, found by testing every endpoint

Added `npm run test:api` in xite-B — 76 checks against a booted server and an
in-memory MongoDB, so it touches nothing real and needs no credentials. It
covers the layer neither existing suite did: that each route is reachable at
the path the clients use, that its guard is the one intended, and that failures
come back in the shape the frontends parse.

It found four things.

**Admin login charged the limiter for successful sign-ins.**
`handleAdminLogin` called `rateLimit()`, which *records* an attempt as a side
effect, before doing any work. Every sign-in was charged, including correct
ones — so five successful logins in a quarter hour locked the administrator out
of an account they had just proved they owned. Keyed on the address rather than
the account, so one person doing that shut out everyone behind the same office
IP. This is the exact bug `isRateLimited` was split out to fix for college
sign-in; admin login was left on the old path. It checks without charging now,
charges in the `catch`, and only for a 400/401 — a database outage no longer
spends the operator's five attempts.

**`GET /admin/templates/stats` had a decorative guard.** `requireAdmin` threw
for an anonymous caller and the `catch` answered every failure — that one
included — with 200 and a payload of zeros. The endpoint never returned 401 in
its life, and the panel could not tell "signed out" from "library is empty".

**`getTemplateForAdmin` answered confidently when it did not know.** It
fabricated a template on a miss — synthetic row, title derived from the id,
`isPublished: true`, `createdAt` now — so a stale bookmark opened an editor on
a plausible blank section the admin could then save. And before giving up it
guessed by name (`row.name.includes(id) || id.includes(row.id)`), so
`GET /templates/hero` returned whichever template had "hero" in its name, while
the PATCH beside it resolves by exact id. Open one template, save to another.
Exact match or `NotFound` now.

**The section library re-judged admin content by the tenant rule.** A
regression introduced with `getSectionLibrary`: it called `sanitizeSectionHtml`,
the policy for markup a *tenant* submits, which discards `<script>`. Applied to
admin-authored templates it stripped the scripts `sanitizeTemplateCode`
deliberately allows, so every hamburger menu and carousel would have arrived at
the editor dead. Caught before anyone met it.

`sanitize-policies.test.ts` pins both halves of that boundary, including the
consequence worth keeping in view: **a template's script survives in the library
and does not survive `PUT /api/v1/my-website`**, because tenant markup renders
on the platform apex. Stated as a fact so nobody makes one side agree with the
other without deciding which policy they meant.

---

## 12. The recovery tool overrode the machine's DNS resolver

`scripts/admin.mjs` carried a copy of the `dns.setServers(["8.8.8.8",
"1.1.1.1"])` call removed from `src/config/db.ts` in finding 08.

It matters more there than it did in the service. This is the tool an operator
reaches for when they cannot sign in, so it runs on laptops, on VPNs and behind
corporate or split-horizon resolvers — exactly where replacing the system
resolver with a public one makes the cluster *less* reachable. A recovery tool
that fails to resolve is worse than no recovery tool. Behind `DNS_SERVERS` now.

---

## Verification

| Check | Scope | Result |
| :--- | :--- | :--- |
| Unit tests | xite-admin | 12 passed — the first tests in this repo |
| Unit tests | xite-B | 138 passed |
| **API end-to-end** | xite-B | **76 checks passed** against a booted server + in-memory MongoDB |
| `tsc --noEmit` | all three repos | 0 errors |
| Production build | all three repos | pass |
| OpenAPI + shared-file gates | xite-B | both green |
| Boot with a working database | local | connects; `/status` returns two booleans |
| Boot with a **dead** database | local | health + docs reachable; DB routes 503 immediately with CORS and `Retry-After: 15` |
| `/api/v1/admin/status` | production | bootstrap state no longer leaked |
| Alias coverage after removals | production | all five spellings of `/status` → 200, identical |
| Removed endpoints | production | save- / update- / delete-section → 404 |
| Guards intact | production | templates, users, overview → 401 without a cookie |
| CORS preflight | production | allow-origin + expose-headers correct |
| Admin bundle | production | 0 × `xite_admin_local_templates`, 0 × `delete-section` |
| Deep link | production | `admin.webxite.org/users` → 200 |

**Not run:** the authenticated workflows. Signing in and driving each screen —
approving a request, uploading a template folder, changing a user's password —
was not done, because that session had no Super Admin credentials. The
unauthenticated surface, the deployment, the bundle contents and both database
states are confirmed; the authenticated click-paths are reasoned from the code.

---

## Open

1. **No dashboard, and two endpoints for one.**
   `/api/v1/admin/overview` and `/api/v1/admin/sites` are implemented, guarded
   and unused. `/` redirects to the templates list, and `App.tsx` says why:
   "Templates is the landing screen because it is the only one built." Either
   build the overview screen or retire the endpoints — implemented-but-
   unreachable API surface is how the duplicates in finding 06 accumulated.

2. **The router basename is inferred from a path prefix.**
   `App.tsx` sets `basename` to `/admin` when
   `location.pathname.startsWith("/admin")`. That also matches a future
   `/administrators` route, and it is computed once at module load. It works
   today because the panel is served at a root domain.

3. **Carried over from the editor audit.** `cookie-domain.ts` has genuinely
   drifted between xite-F and xite-B in session-cookie logic, and the shared-file
   checker still cannot detect cross-repo drift in the general case. Both are
   unchanged by this work.
