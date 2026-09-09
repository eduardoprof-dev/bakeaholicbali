const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), "bakeaholic-oauth-http-"));
process.env.DATA_DIR = runtimeDir;
process.env.ADMIN_AUTH_STATE_PATH = path.join(runtimeDir, "admin-auth-state.json");
process.env.ADMIN_AUTH_AUDIT_PATH = path.join(runtimeDir, "admin-auth-audit.jsonl");
process.env.GOOGLE_ADMIN_CLIENT_ID = "http-test-google-client";
process.env.GOOGLE_ADMIN_CLIENT_SECRET = "unused-http-test-secret";
process.env.GOOGLE_ADMIN_REDIRECT_URI = "https://staging.example.invalid/api/admin/oauth/google/callback";
process.env.ADMIN_GOOGLE_ALLOWED_EMAILS = "owner@example.invalid,orders-manager@example.invalid";
process.env.ADMIN_SESSION_SECRET = "isolated-admin-test-secret";
process.env.SESSION_SECRET = "customer-session-test-secret";
process.env.ADMIN_GOOGLE_ONLY = "true";
fs.writeFileSync(path.join(runtimeDir, "admin-users.json"), JSON.stringify({
  users: [
    { id: "owner", email: "owner@example.invalid", role: "owner", blocked: false },
    { id: "orders-manager", email: "orders-manager@example.invalid", role: "orders_manager", blocked: false },
    { id: "unconfigured", email: "active-but-unconfigured@example.invalid", role: "orders_manager", blocked: false }
  ]
}));

const { server, createAdminSession, createSignedSession, verifyGoogleIdToken, resetGoogleJwksCacheForTest } = require("./server");

function request(port, pathname, { method = "GET", headers = {}, body = "" } = {}) {
  return new Promise((resolve, reject) => {
    const payload = Buffer.from(body);
    const req = http.request({
      host: "127.0.0.1",
      port,
      path: pathname,
      method,
      headers: {
        host: "staging.example.invalid",
        "x-forwarded-proto": "https",
        ...(payload.length ? { "content-length": String(payload.length) } : {}),
        ...headers
      }
    }, (res) => {
      let responseBody = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { responseBody += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: responseBody }));
    });
    req.once("error", reject);
    if (payload.length) req.write(payload);
    req.end();
  });
}

function cookieValue(setCookie, name) {
  const item = (Array.isArray(setCookie) ? setCookie : [setCookie]).find((value) => String(value).startsWith(`${name}=`));
  return String(item || "").split(";")[0];
}

function signedIdToken(privateKey, claims, kid = "test-kid") {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "RS256", kid, typ: "JWT" });
  const payload = encode(claims);
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  return `${header}.${payload}.${signer.sign(privateKey).toString("base64url")}`;
}

test("HTTP OAuth boundary enforces host-only cookies, CSRF, capability, logout and durable start limits", async (t) => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  t.after(() => fs.rmSync(runtimeDir, { recursive: true, force: true }));
  const port = server.address().port;

  const start = await request(port, "/api/admin/oauth/google/start");
  assert.equal(start.status, 302);
  assert.match(start.headers.location, /^https:\/\/accounts\.google\.com\//);
  const stateCookie = String(start.headers["set-cookie"]);
  assert.match(stateCookie, /__Host-bakeaholic_admin_oauth_state=/);
  assert.match(stateCookie, /Path=\//);
  assert.match(stateCookie, /Secure/);
  assert.doesNotMatch(stateCookie, /Domain=/i);

  const invalidCallback = await request(port, "/api/admin/oauth/google/callback?state=wrong&code=wrong", {
    headers: { cookie: cookieValue(start.headers["set-cookie"], "__Host-bakeaholic_admin_oauth_state") }
  });
  assert.equal(invalidCallback.status, 302);
  assert.equal(invalidCallback.headers.location, "/admin.html?auth=oauth_error");
  assert.match(String(invalidCallback.headers["set-cookie"]), /__Host-bakeaholic_admin_oauth_state=;/);
  assert.doesNotMatch(String(invalidCallback.headers["set-cookie"]), /Domain=/i);

  const originalFetch = global.fetch;
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" });
  Object.assign(jwk, { kid: "route-test-kid", alg: "RS256", use: "sig" });
  const now = Math.floor(Date.now() / 1000);
  const baseClaims = {
    iss: "https://accounts.google.com",
    aud: process.env.GOOGLE_ADMIN_CLIENT_ID,
    exp: now + 60,
    iat: now,
    email_verified: true,
    sub: "route-subject"
  };
  global.fetch = async (url, options = {}) => {
    if (String(url).includes("oauth2.googleapis.com/token")) {
      const code = String(options.body || "");
      const isUnconfigured = code.includes("unconfigured-code");
      return {
        ok: true,
        json: async () => ({
          id_token: signedIdToken(privateKey, {
            ...baseClaims,
            nonce: currentRouteNonce,
            email: isUnconfigured ? "active-but-unconfigured@example.invalid" : "owner@example.invalid"
          }, "route-test-kid")
        })
      };
    }
    return { ok: true, json: async () => ({ keys: [jwk] }) };
  };
  let currentRouteNonce = "";
  try {
    const ownerStart = await request(port, "/api/admin/oauth/google/start");
    const ownerUrl = new URL(ownerStart.headers.location);
    currentRouteNonce = ownerUrl.searchParams.get("nonce");
    const ownerCallback = await request(port, `/api/admin/oauth/google/callback?state=${encodeURIComponent(ownerUrl.searchParams.get("state"))}&code=owner-code`, {
      headers: { cookie: cookieValue(ownerStart.headers["set-cookie"], "__Host-bakeaholic_admin_oauth_state") }
    });
    assert.equal(ownerCallback.status, 302);
    assert.equal(ownerCallback.headers.location, "/admin.html?auth=success");
    assert.match(String(ownerCallback.headers["set-cookie"]), /__Host-bakeaholic_admin_session=/);
    assert.doesNotMatch(String(ownerCallback.headers["set-cookie"]), /Domain=/i);

    const unconfiguredStart = await request(port, "/api/admin/oauth/google/start");
    const unconfiguredUrl = new URL(unconfiguredStart.headers.location);
    currentRouteNonce = unconfiguredUrl.searchParams.get("nonce");
    const unconfiguredCallback = await request(port, `/api/admin/oauth/google/callback?state=${encodeURIComponent(unconfiguredUrl.searchParams.get("state"))}&code=unconfigured-code`, {
      headers: { cookie: cookieValue(unconfiguredStart.headers["set-cookie"], "__Host-bakeaholic_admin_oauth_state") }
    });
    assert.equal(unconfiguredCallback.status, 302);
    assert.equal(unconfiguredCallback.headers.location, "/admin.html?auth=oauth_error&reason=oauth_rejected");
  } finally {
    global.fetch = originalFetch;
  }

  const parallelStarts = await Promise.all(Array.from({ length: 7 }, () => request(port, "/api/admin/oauth/google/start")));
  assert.equal(parallelStarts.filter((response) => response.status === 302).length, 7);
  const limitedStart = await request(port, "/api/admin/oauth/google/start");
  assert.equal(limitedStart.status, 503);
  const persisted = JSON.parse(fs.readFileSync(process.env.ADMIN_AUTH_STATE_PATH, "utf8"));
  assert.ok(Object.keys(persisted.oauthStates).length <= 10);
  assert.ok(Object.keys(persisted.rateLimits).length <= 4);

  const ownerSession = createAdminSession({ role: "admin", staffRole: "owner", staffId: "owner", email: "owner@example.invalid" });
  const ownerToken = createSignedSession(ownerSession, process.env.ADMIN_SESSION_SECRET);
  const csrf = "csrf-capability-token";
  const ownerCookie = `__Host-bakeaholic_admin_session=${ownerToken}; __Host-bakeaholic_admin_csrf=${csrf}`;
  const authenticated = await request(port, "/api/admin/session", { headers: { cookie: ownerCookie } });
  assert.equal(authenticated.status, 200);

  const missingCsrf = await request(port, "/api/admin/staff", { method: "POST", headers: { cookie: ownerCookie, "content-type": "application/json" }, body: "{}" });
  assert.equal(missingCsrf.status, 403);
  assert.match(missingCsrf.body, /CSRF/);
  const crossOrigin = await request(port, "/api/admin/staff", {
    method: "POST",
    headers: { cookie: ownerCookie, origin: "https://evil.example", "x-admin-csrf": csrf, "content-type": "application/json" },
    body: "{}"
  });
  assert.equal(crossOrigin.status, 403);
  assert.match(crossOrigin.body, /CSRF/);

  const staffSession = createAdminSession({ role: "admin", staffRole: "orders_manager", staffId: "orders-manager", email: "orders-manager@example.invalid" });
  const staffToken = createSignedSession(staffSession, process.env.ADMIN_SESSION_SECRET);
  const capabilityDenied = await request(port, "/api/admin/integrations", {
    headers: { cookie: `__Host-bakeaholic_admin_session=${staffToken}` }
  });
  assert.equal(capabilityDenied.status, 403);

  const logout = await request(port, "/api/admin/logout", { method: "POST", headers: { cookie: ownerCookie } });
  assert.equal(logout.status, 200);
  assert.match(String(logout.headers["set-cookie"]), /__Host-bakeaholic_admin_session=;/);
  assert.doesNotMatch(String(logout.headers["set-cookie"]), /Domain=/i);
  const revoked = await request(port, "/api/admin/session", { headers: { cookie: ownerCookie } });
  assert.equal(revoked.status, 401);
});

test("generated-key signed Google tokens enforce provider claims and active-unconfigured rejection", async () => {
  const originalFetch = global.fetch;
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" });
  Object.assign(jwk, { kid: "test-kid", alg: "RS256", use: "sig" });
  resetGoogleJwksCacheForTest();
  global.fetch = async () => ({ ok: true, json: async () => ({ keys: [jwk] }) });
  const now = Math.floor(Date.now() / 1000);
  const base = {
    iss: "https://accounts.google.com",
    aud: process.env.GOOGLE_ADMIN_CLIENT_ID,
    exp: now + 60,
    iat: now,
    nonce: "expected-nonce",
    email_verified: true,
    sub: "provider-subject"
  };
  try {
    const valid = signedIdToken(privateKey, { ...base, email: "owner@example.invalid" });
    assert.equal((await verifyGoogleIdToken(valid, "expected-nonce")).email, "owner@example.invalid");
    const unconfigured = signedIdToken(privateKey, { ...base, email: "active-but-unconfigured@example.invalid" });
    await assert.rejects(() => verifyGoogleIdToken(unconfigured, "expected-nonce"), /allowlist/);
    const [header, payload, signature] = valid.split(".");
    const tampered = `${header}.${payload}.${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`;
    await assert.rejects(() => verifyGoogleIdToken(tampered, "expected-nonce"), /signature/);
    await assert.rejects(() => verifyGoogleIdToken(signedIdToken(privateKey, { ...base, iss: "https://evil.example", email: "owner@example.invalid" }), "expected-nonce"), /issuer/);
    await assert.rejects(() => verifyGoogleIdToken(signedIdToken(privateKey, { ...base, aud: "wrong", email: "owner@example.invalid" }), "expected-nonce"), /audience/);
    await assert.rejects(() => verifyGoogleIdToken(signedIdToken(privateKey, { ...base, azp: "wrong", email: "owner@example.invalid" }), "expected-nonce"), /party/);
    await assert.rejects(() => verifyGoogleIdToken(signedIdToken(privateKey, { ...base, email_verified: false, email: "owner@example.invalid" }), "expected-nonce"), /verified/);
    await assert.rejects(() => verifyGoogleIdToken(valid, "wrong-nonce"), /nonce/);
  } finally {
    global.fetch = originalFetch;
  }
});
