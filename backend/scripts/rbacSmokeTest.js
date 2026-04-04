import assert from "node:assert/strict";

const BASE_URL = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

function url(path) {
  return `${BASE_URL}${path}`;
}

async function expectStatus(path, expectedStatus, options = {}) {
  const response = await fetch(url(path), {
    method: options.method || "GET",
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  assert.equal(
    response.status,
    expectedStatus,
    `${options.method || "GET"} ${path} expected ${expectedStatus} but got ${response.status}`
  );

  return response;
}

async function runUnauthChecks() {
  const protectedChecks = [
    { method: "GET", path: "/api/admin/stats", expectedStatus: 401 },
    { method: "GET", path: "/api/cart/get", expectedStatus: 401 },
    { method: "GET", path: "/api/order/my-orders", expectedStatus: 401 },
    { method: "POST", path: "/api/user/get-user", expectedStatus: 401, body: {} },
  ];

  for (const check of protectedChecks) {
    await expectStatus(check.path, check.expectedStatus, {
      method: check.method,
      body: check.body,
    });
  }

  await expectStatus("/api/product/list", 200);
}

async function runOptionalRoleChecks() {
  const userEmail = process.env.TEST_USER_EMAIL;
  const userPassword = process.env.TEST_USER_PASSWORD;

  if (!userEmail || !userPassword) {
    console.log("[rbac] Skipping role checks: TEST_USER_EMAIL/TEST_USER_PASSWORD not provided.");
    return;
  }

  const loginRes = await fetch(url("/api/auth/login"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: userEmail, password: userPassword }),
  });

  assert.equal(loginRes.status, 200, `[rbac] user login failed with status ${loginRes.status}`);

  const setCookie = loginRes.headers.get("set-cookie") || "";
  assert.ok(setCookie.includes("token="), "[rbac] login did not return auth cookie");

  const adminRes = await fetch(url("/api/admin/stats"), {
    method: "GET",
    headers: { cookie: setCookie },
  });

  assert.equal(adminRes.status, 403, `[rbac] customer should not access admin route, got ${adminRes.status}`);
}

(async () => {
  try {
    console.log(`[rbac] Running RBAC smoke tests against ${BASE_URL}`);
    await runUnauthChecks();
    await runOptionalRoleChecks();
    console.log("[rbac] PASS: RBAC smoke checks succeeded.");
    process.exit(0);
  } catch (error) {
    console.error("[rbac] FAIL:", error.message);
    process.exit(1);
  }
})();
