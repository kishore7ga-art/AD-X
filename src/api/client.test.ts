import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

import { ApiError, api, setUnauthorizedHandler } from "@/api/client";

/**
 * A stand-in for `fetch`, so the client's own behaviour can be tested without a
 * server: what it sends, what it does with a failure, and — the part that
 * matters most here — whether a 401 anywhere ends the session.
 */
type Call = { url: string; init: RequestInit };

let calls: Call[] = [];
let reply: (call: Call) => Response;

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

beforeEach(() => {
  calls = [];
  reply = () => jsonResponse({ ok: true });
  globalThis.fetch = (async (url: string | URL | Request, init: RequestInit = {}) => {
    const call = { url: String(url), init };
    calls.push(call);
    return reply(call);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  setUnauthorizedHandler(null);
});

describe("every request carries the admin cookie", () => {
  it("sends credentials on a GET", async () => {
    await api.get("/api/v1/admin/me");
    assert.equal(calls[0]!.init.credentials, "include");
  });

  it("sends credentials on a write, with a JSON content type", async () => {
    await api.post("/api/v1/admin/templates", { name: "x" });
    assert.equal(calls[0]!.init.credentials, "include");
    assert.deepEqual(calls[0]!.init.headers, { "Content-Type": "application/json" });
    assert.equal(calls[0]!.init.body, JSON.stringify({ name: "x" }));
  });

  it("sends credentials on a multipart upload, and sets no content type", async () => {
    // The browser has to add the multipart boundary itself; setting the header
    // by hand produces a body the server cannot parse.
    const form = new FormData();
    form.append("name", "x");
    await api.postForm("/api/v1/admin/templates", form);

    assert.equal(calls[0]!.init.credentials, "include");
    assert.equal(calls[0]!.init.headers, undefined);
  });
});

describe("failures carry the API's own message", () => {
  it("reads `{ error }` rather than reporting a status code", async () => {
    reply = () => jsonResponse({ error: "Template not found" }, { status: 404 });
    await assert.rejects(api.get("/api/v1/admin/templates/nope"), (cause: unknown) => {
      assert.ok(cause instanceof ApiError);
      assert.equal(cause.status, 404);
      assert.equal(cause.message, "Template not found");
      return true;
    });
  });

  it("falls back to the status when the body carries no message", async () => {
    reply = () => new Response("nope", { status: 502 });
    await assert.rejects(api.get("/x"), (cause: unknown) => {
      assert.equal((cause as ApiError).message, "Request failed (502)");
      return true;
    });
  });
});

describe("Retry-After — the wait the API actually enforces", () => {
  it("reads a delay in seconds", async () => {
    reply = () =>
      jsonResponse({ error: "Too many attempts." }, { status: 429, headers: { "Retry-After": "840" } });
    await assert.rejects(api.post("/api/v1/admin/auth/login", {}), (cause: unknown) => {
      assert.equal((cause as ApiError).retryAfterSeconds, 840);
      return true;
    });
  });

  it("reads the HTTP-date form too", async () => {
    const at = new Date(Date.now() + 120_000).toUTCString();
    reply = () => jsonResponse({ error: "wait" }, { status: 429, headers: { "Retry-After": at } });
    await assert.rejects(api.get("/x"), (cause: unknown) => {
      const seconds = (cause as ApiError).retryAfterSeconds ?? 0;
      assert.ok(seconds > 110 && seconds <= 121, `got ${seconds}`);
      return true;
    });
  });

  it("is undefined when the API did not say", async () => {
    reply = () => jsonResponse({ error: "nope" }, { status: 429 });
    await assert.rejects(api.get("/x"), (cause: unknown) => {
      assert.equal((cause as ApiError).retryAfterSeconds, undefined);
      return true;
    });
  });
});

describe("a 401 ends the session, once, everywhere", () => {
  it("fires the handler for an ordinary call", async () => {
    let fired = 0;
    setUnauthorizedHandler(() => {
      fired += 1;
    });
    reply = () => jsonResponse({ error: "Not signed in" }, { status: 401 });

    await assert.rejects(api.get("/api/v1/admin/templates"));
    assert.equal(fired, 1);
  });

  it("fires for a multipart upload too", async () => {
    let fired = 0;
    setUnauthorizedHandler(() => {
      fired += 1;
    });
    reply = () => jsonResponse({ error: "Not signed in" }, { status: 401 });

    await assert.rejects(api.postForm("/api/v1/admin/templates", new FormData()));
    assert.equal(fired, 1);
  });

  it("does NOT fire for a rejected sign-in", async () => {
    // A wrong password is also a 401. There is no session to end, and firing
    // here would clear the login form's state underneath the person typing.
    let fired = 0;
    setUnauthorizedHandler(() => {
      fired += 1;
    });
    reply = () => jsonResponse({ error: "Wrong password" }, { status: 401 });

    await assert.rejects(api.post("/api/v1/admin/auth/login", { password: "x" }));
    await assert.rejects(api.post("/api/v1/admin/login", { password: "x" }));
    assert.equal(fired, 0);
  });

  it("does not fire on any other status", async () => {
    let fired = 0;
    setUnauthorizedHandler(() => {
      fired += 1;
    });
    for (const status of [400, 403, 404, 429, 500, 503]) {
      reply = () => jsonResponse({ error: "no" }, { status });
      await assert.rejects(api.get("/x"));
    }
    assert.equal(fired, 0);
  });
});
