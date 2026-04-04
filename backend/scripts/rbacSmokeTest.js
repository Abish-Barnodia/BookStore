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

async function runRoleChecks() {
  const userEmail = process.env.TEST_USER_EMAIL;
  const userPassword = process.env.TEST_USER_PASSWORD;
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;

  if (!userEmail || !userPassword) {
    console.log("[rbac] Skipping customer check: TEST_USER_EMAIL/TEST_USER_PASSWORD not provided.");
  } else {
    const loginRes = await fetch(url("/api/auth/login"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });

    assert.equal(loginRes.status, 200, `[rbac] user login failed with status ${loginRes.status}`);

    const setCookie = loginRes.headers.get("set-cookie") || "";
    assert.ok(setCookie.includes("token="), "[rbac] user login did not return auth cookie");

    const adminRes = await fetch(url("/api/admin/stats"), {
      method: "GET",
      headers: { cookie: setCookie },
    });

    assert.equal(adminRes.status, 403, `[rbac] customer should not access admin route, got ${adminRes.status}`);
  }

  if (!adminEmail || !adminPassword) {
    console.log("[rbac] Skipping admin check: TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD not provided.");
    return;
  }

  const adminLoginRes = await fetch(url("/api/auth/admin-login"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  assert.equal(adminLoginRes.status, 200, `[rbac] admin login failed with status ${adminLoginRes.status}`);

  const adminCookie = adminLoginRes.headers.get("set-cookie") || "";
  assert.ok(adminCookie.includes("token="), "[rbac] admin login did not return auth cookie");

  const statsRes = await fetch(url("/api/admin/stats"), {
    method: "GET",
    headers: { cookie: adminCookie },
  });

  assert.equal(statsRes.status, 200, `[rbac] admin should access admin route, got ${statsRes.status}`);
}

(async () => {
  try {
    console.log(`[rbac] Running RBAC smoke tests against ${BASE_URL}`);
    await runUnauthChecks();
    await runRoleChecks();
    console.log("[rbac] PASS: RBAC smoke checks succeeded.");
    process.exit(0);
  } catch (error) {
    console.error("[rbac] FAIL:", error.message);
    process.exit(1);
  }
})();
