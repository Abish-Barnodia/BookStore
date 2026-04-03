import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));

let adminInitAttempted = false;

/** Google publishes Firebase Auth signing certs here (RS256). */
const FIREBASE_CERTS_URL =
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certsCache = { data: null, expiresAt: 0 };

function tryInitFirebaseAdmin() {
    if (admin.apps.length > 0) return true;

    const pathFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const candidates = [
        pathFromEnv,
        join(__dirname, "..", "firebase-service-account.json"),
    ].filter(Boolean);

    for (const p of candidates) {
        try {
            if (!existsSync(p)) continue;
            const sa = JSON.parse(readFileSync(p, "utf8"));
            admin.initializeApp({ credential: admin.credential.cert(sa) });
            console.log("Firebase Admin initialized from service account file");
            return true;
        } catch (e) {
            console.warn("Firebase Admin could not load", p, e.message);
        }
    }

    const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (inline) {
        try {
            const sa = JSON.parse(inline);
            admin.initializeApp({ credential: admin.credential.cert(sa) });
            console.log("Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON");
            return true;
        } catch (e) {
            console.warn("FIREBASE_SERVICE_ACCOUNT_JSON invalid:", e.message);
        }
    }

    return false;
}

async function fetchFirebasePublicCerts() {
    const res = await fetch(FIREBASE_CERTS_URL);
    if (!res.ok) {
        throw new Error(`Failed to fetch Firebase public certs: HTTP ${res.status}`);
    }
    const cacheControl = res.headers.get("cache-control") || "";
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const maxAgeMs = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600 * 1000;

    const data = await res.json();
    certsCache = {
        data,
        expiresAt: Date.now() + Math.max(maxAgeMs - 120_000, 60_000),
    };
    return data;
}

async function getCertPemForKid(kid) {
    let certs = certsCache.data;
    if (!certs || Date.now() >= certsCache.expiresAt) {
        certs = await fetchFirebasePublicCerts();
    }
    let pem = certs[kid];
    if (!pem) {
        certsCache = { data: null, expiresAt: 0 };
        certs = await fetchFirebasePublicCerts();
        pem = certs[kid];
    }
    if (!pem) {
        throw new Error(`No Firebase public cert for kid=${kid}`);
    }
    return pem;
}

/**
 * Verify Firebase ID token using Google's published RS256 certs (no service account needed).
 * This is the recommended approach when Firebase Admin is not configured.
 */
async function verifyWithFirebasePublicKeys(idToken, projectId) {
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded?.header?.kid || !decoded.header.alg) {
        throw new Error("Malformed ID token");
    }
    if (decoded.header.alg !== "RS256") {
        throw new Error(`Unexpected token alg: ${decoded.header.alg}`);
    }

    const kid = decoded.header.kid;
    const pem = await getCertPemForKid(kid);

    const extras = (process.env.FIREBASE_ACCEPTED_AUDIENCES || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const audiences = [projectId, ...extras];

    const issuer = `https://securetoken.google.com/${projectId}`;

    const payload = jwt.verify(idToken, pem, {
        algorithms: ["RS256"],
        issuer,
        audience: audiences.length === 1 ? audiences[0] : audiences,
    });

    if (!payload.email) {
        throw new Error("Token has no email (enable email scope in Google provider)");
    }

    return {
        email: payload.email,
        name: payload.name || String(payload.email).split("@")[0] || "User",
    };
}

/**
 * Verify a Firebase Auth ID token (from getIdToken() after Google sign-in).
 * 1) Firebase Admin SDK if service account is configured
 * 2) RS256 verify against Google's securetoken certificates (works without service account)
 */
export async function verifyFirebaseIdToken(idToken, projectId) {
    if (!idToken || typeof idToken !== "string") {
        throw new Error("Missing id token");
    }

    if (!adminInitAttempted) {
        adminInitAttempted = true;
        tryInitFirebaseAdmin();
    }

    if (admin.apps.length > 0) {
        const decoded = await admin.auth().verifyIdToken(idToken);
        return {
            email: decoded.email,
            name: decoded.name || decoded.email?.split("@")[0] || "User",
        };
    }

    try {
        return await verifyWithFirebasePublicKeys(idToken, projectId);
    } catch (err) {
        console.error("Firebase ID token verify (RS256):", err.message);
        throw new Error(
            `${err.message}. Check FIREBASE_PROJECT_ID matches frontend Firebase config projectId (${projectId}).`
        );
    }
}
