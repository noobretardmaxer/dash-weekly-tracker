import { createPrivateKey } from "crypto";
import { JWT } from "google-auth-library";
import { env } from "../../lib/env";
import { classifyGscError, GscError, type GscErrorInfo } from "./errors";

/**
 * Authentication layer for Google Search Console.
 *
 * Search Console (`searchanalytics`, `sites`, `sitemaps`, `urlInspection`) does
 * NOT accept API keys — it requires OAuth 2.0 via a service-account JWT. This
 * module resolves credentials, validates the private key BEFORE any request
 * (so a bad key fails fast with a classified error instead of leaking OpenSSL's
 * `DECODER routines::unsupported` to the UI), and hands out cached access
 * tokens for the read-only Webmasters scope.
 *
 * Credential resolution order:
 *   1. GOOGLE_SERVICE_ACCOUNT_B64  — base64 of the entire service-account JSON.
 *      Preferred: no newline/quote escaping to get wrong.
 *   2. GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY — legacy
 *      pair. The PEM is cleaned defensively (wrapping quotes stripped, escaped
 *      `\n` restored) because that is exactly how the key was mangled in prod.
 */

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];
// google-auth-library refreshes the cached token this many ms before expiry.
const EAGER_REFRESH_MS = 5 * 60 * 1000;

export interface ServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
  /** Which env var the credentials came from — surfaced by gsc:doctor. */
  source: "GOOGLE_SERVICE_ACCOUNT_B64" | "GOOGLE_SERVICE_ACCOUNT_EMAIL+PRIVATE_KEY";
}

function fail(info: Omit<GscErrorInfo, "retryable" | "raw"> & { raw?: string }): never {
  throw new GscError({ retryable: false, raw: info.raw ?? info.reason, ...info });
}

/**
 * Strip matching wrapping quotes, possibly nested. Prod had the value shell-
 * wrapped in single quotes around the JSON's own double quotes (`'"...\n..."'`),
 * so after the env parser removes the outer layer a literal `"` still bracketed
 * the PEM — the reason OpenSSL saw `"-----BEGIN PRIVATE KEY-----`.
 */
export function stripWrappingQuotes(value: string): string {
  let v = value.trim();
  while (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/** Clean a raw PEM env value: quotes off, escaped newlines restored, trimmed. */
export function normalizePrivateKey(raw: string): string {
  return stripWrappingQuotes(raw).replace(/\\n/g, "\n").trim();
}

function validate(creds: ServiceAccountCredentials): ServiceAccountCredentials {
  const { privateKey, clientEmail } = creds;

  if (!clientEmail.includes("@")) {
    fail({
      code: "AUTH_INVALID_KEY",
      reason: "Service-account client_email is missing or malformed.",
      remedy: "Use the `client_email` from the service-account JSON (ends with .iam.gserviceaccount.com).",
    });
  }

  if (privateKey.includes("BEGIN RSA PRIVATE KEY")) {
    fail({
      code: "AUTH_INVALID_KEY",
      reason: "Private key is PKCS#1 (BEGIN RSA PRIVATE KEY), which OpenSSL 3 rejects for JWT signing.",
      remedy: "Use the PKCS#8 key (BEGIN PRIVATE KEY) from the service-account JSON, or convert it: `openssl pkcs8 -topk8 -nocrypt`.",
    });
  }
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    fail({
      code: "AUTH_INVALID_KEY",
      reason: "Private key does not look like a PKCS#8 PEM (missing the '-----BEGIN PRIVATE KEY-----' header).",
      remedy: "Check the value isn't an API key or a quoted/truncated string; it must be the full private_key from the service-account JSON.",
    });
  }

  // Definitive check: make OpenSSL parse it here, at startup, classified — this
  // is where `error:1E08010C:DECODER routines::unsupported` would otherwise be
  // thrown mid-sync and shown raw in the banner.
  try {
    createPrivateKey(privateKey);
  } catch (e) {
    fail({
      code: "AUTH_INVALID_KEY",
      reason: "Private key could not be parsed by OpenSSL (the 'DECODER routines::unsupported' failure).",
      remedy:
        "Re-copy the key — it may have surrounding quotes, be truncated, or have mangled newlines. Prefer GOOGLE_SERVICE_ACCOUNT_B64 (base64 of the whole JSON) to avoid newline/quote handling entirely.",
      raw: (e as Error).message,
    });
  }

  return creds;
}

function resolveCredentials(): ServiceAccountCredentials {
  const b64 = env.GOOGLE_SERVICE_ACCOUNT_B64?.trim();
  if (b64) {
    let parsed: { client_email?: string; private_key?: string };
    try {
      parsed = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    } catch (e) {
      fail({
        code: "AUTH_INVALID_KEY",
        reason: "GOOGLE_SERVICE_ACCOUNT_B64 did not decode to valid JSON.",
        remedy: "It must be the base64 of the ENTIRE downloaded service-account .json file: `base64 -i service-account.json`.",
        raw: (e as Error).message,
      });
    }
    if (!parsed.client_email || !parsed.private_key) {
      fail({
        code: "AUTH_INVALID_KEY",
        reason: "Decoded service-account JSON is missing client_email or private_key.",
        remedy: "Re-download the JSON key from Google Cloud → IAM & Admin → Service Accounts → Keys, and base64 the whole file.",
      });
    }
    // JSON.parse already turned the JSON `\n` escapes into real newlines; the
    // normalize pass is a harmless, defensive no-op here.
    return validate({
      clientEmail: parsed.client_email.trim(),
      privateKey: normalizePrivateKey(parsed.private_key),
      source: "GOOGLE_SERVICE_ACCOUNT_B64",
    });
  }

  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!clientEmail || !rawKey) {
    fail({
      code: "CONFIG_MISSING",
      reason: "Google Search Console credentials are not configured.",
      remedy: "Set GOOGLE_SERVICE_ACCOUNT_B64 (preferred) or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    });
  }
  return validate({
    clientEmail,
    privateKey: normalizePrivateKey(rawKey),
    source: "GOOGLE_SERVICE_ACCOUNT_EMAIL+PRIVATE_KEY",
  });
}

let cachedCreds: ServiceAccountCredentials | null = null;
let cachedClient: JWT | null = null;

function getCredentials(): ServiceAccountCredentials {
  if (!cachedCreds) cachedCreds = resolveCredentials();
  return cachedCreds;
}

function getClient(): JWT {
  if (cachedClient) return cachedClient;
  const creds = getCredentials();
  const client = new JWT({ email: creds.clientEmail, key: creds.privateKey, scopes: SCOPES });
  client.eagerRefreshThresholdMillis = EAGER_REFRESH_MS;
  cachedClient = client;
  return client;
}

/** The service account's email — safe to log; used by gsc:doctor and index-status jobs. */
export function getServiceAccountEmail(): string {
  return getCredentials().clientEmail;
}

/** Which env var the credentials were loaded from. */
export function getCredentialSource(): ServiceAccountCredentials["source"] {
  return getCredentials().source;
}

/**
 * A cached, valid access token for the read-only Webmasters scope. The
 * underlying JWT client caches and eagerly refreshes 5 min before expiry; every
 * failure is re-thrown as a classified {@link GscError}.
 */
export async function getAccessToken(): Promise<string> {
  const client = getClient();
  try {
    const { token } = await client.getAccessToken();
    if (!token) {
      throw new GscError({
        code: "AUTH_INVALID_KEY",
        retryable: false,
        reason: "Google returned an empty access token.",
        remedy: "Re-check the service-account key and that the Search Console API is enabled in the Cloud project.",
        raw: "empty access token",
      });
    }
    return token;
  } catch (e) {
    if (e instanceof GscError) throw e;
    throw new GscError(classifyGscError(e));
  }
}

/** Test seam: drop cached credentials/client so a new env is picked up. */
export function resetGscAuthCache(): void {
  cachedCreds = null;
  cachedClient = null;
}
