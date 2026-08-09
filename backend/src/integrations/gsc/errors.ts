/**
 * Error classification for the Google Search Console integration.
 *
 * The whole reason this integration took days to diagnose was that a raw Node
 * OpenSSL string (`error:1E08010C:DECODER routines::unsupported`) bubbled all
 * the way to the sync banner. Every GSC failure now flows through
 * `classifyGscError`, which maps it to a stable `code`, a human-readable
 * `reason`, and a concrete `remedy`. The raw message is preserved on `.raw` for
 * the developer "details" toggle — never shown as the primary message again.
 */

export type GscErrorCode =
  | "CONFIG_MISSING" // credentials not set at all
  | "AUTH_INVALID_KEY" // key can't be parsed / Google rejects the credential
  | "AUTH_NO_PERMISSION" // auth works, but the SA can't see/query the property
  | "PROPERTY_NOT_FOUND" // siteUrl not visible to this service account
  | "QUOTA_EXCEEDED" // 429 / RESOURCE_EXHAUSTED
  | "NETWORK" // transient network error or Google 5xx
  | "UNKNOWN";

export interface GscErrorInfo {
  code: GscErrorCode;
  /** Human-readable classification shown as the banner's primary line. */
  reason: string;
  /** Concrete next step shown under the reason. */
  remedy: string;
  /** Raw underlying error, kept behind a developer "details" toggle. */
  raw: string;
  /** Whether a retry (with backoff) could plausibly succeed. */
  retryable: boolean;
}

/**
 * Carries a fully-classified {@link GscErrorInfo}. Its `.message` is already the
 * human "reason — remedy", so even code paths that only read `error.message`
 * (like the shared sync-log writer) surface something readable, not OpenSSL.
 */
export class GscError extends Error {
  readonly info: GscErrorInfo;

  constructor(info: GscErrorInfo) {
    super(`${info.reason} — ${info.remedy}`);
    this.name = "GscError";
    this.info = info;
  }
}

function extractRaw(error: unknown): string {
  const anyErr = error as {
    response?: { status?: number; data?: { error?: { message?: string } } };
    message?: string;
  };
  const bodyMsg = anyErr?.response?.data?.error?.message;
  if (bodyMsg) return `${anyErr?.response?.status ?? ""} ${bodyMsg}`.trim();
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Map any error thrown while talking to GSC (OpenSSL key parse, google-auth,
 * axios HTTP, network) onto a stable code + human reason + remedy.
 */
export function classifyGscError(error: unknown): GscErrorInfo {
  if (error instanceof GscError) return error.info;

  const anyErr = error as { code?: string; status?: number; response?: { status?: number; data?: { error?: { message?: string } } } };
  const raw = extractRaw(error);
  const status: number | undefined = anyErr?.response?.status ?? anyErr?.status;
  const bodyMsg: string = anyErr?.response?.data?.error?.message ?? "";
  const combined = `${bodyMsg} ${raw}`;

  // 1. OpenSSL / private-key parse failures (thrown locally, before any request).
  const cryptoish =
    /DECODER routines|ERR_OSSL|PEM|asn1|bad (base64|decrypt)|no start line|not enough data|1E08010C|unsupported/i.test(raw) ||
    ["ERR_OSSL_UNSUPPORTED", "ERR_OSSL_PEM_NO_START_LINE", "ERR_OSSL_EVP_DECODE_ERROR"].includes(anyErr?.code ?? "");
  if (cryptoish && !anyErr?.response) {
    return {
      code: "AUTH_INVALID_KEY",
      retryable: false,
      reason: "The service-account private key could not be parsed by OpenSSL (the 'DECODER routines::unsupported' failure).",
      remedy:
        "The key is likely wrapped in quotes, truncated, has mangled newlines, or is the wrong format (must be PKCS#8). Set GOOGLE_SERVICE_ACCOUNT_B64 to base64 of the whole JSON key to sidestep all escaping.",
      raw,
    };
  }

  // 2. Network / transient (retry with backoff).
  if (
    ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNABORTED", "ERR_NETWORK"].includes(anyErr?.code ?? "") ||
    (status !== undefined && status >= 500)
  ) {
    return {
      code: "NETWORK",
      retryable: true,
      reason: "Could not reach the Google Search Console API (network error or Google 5xx).",
      remedy: "Usually transient — the sync retries with backoff. If it persists, check outbound network and the Google API status page.",
      raw,
    };
  }

  // 3. Quota / rate limit.
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate.?limit|too many requests/i.test(combined)) {
    return {
      code: "QUOTA_EXCEEDED",
      retryable: true,
      reason: "Google Search Console API quota / rate limit hit (429).",
      remedy: "The sync backs off and resumes automatically. If chronic, reduce backfill concurrency or spread the jobs out over time.",
      raw,
    };
  }

  // 4. Permission — auth succeeds but the SA can't access the data. This is the
  //    "auth works but no data" case that is maximally confusing without a code.
  if (status === 403 || /PERMISSION_DENIED|does not have (sufficient )?permission|insufficientPermissions|forbidden/i.test(combined)) {
    return {
      code: "AUTH_NO_PERMISSION",
      retryable: false,
      reason: "Authenticated, but the service account lacks permission for this property (or the Search Console API is not enabled).",
      remedy:
        "In Search Console → Settings → Users and permissions, add the service-account email with Full permission on the property. Also confirm searchconsole.googleapis.com is enabled in the Cloud project.",
      raw,
    };
  }

  // 5. Property not found for this service account.
  if (status === 404 || /NOT_FOUND|does not exist/i.test(combined)) {
    return {
      code: "PROPERTY_NOT_FOUND",
      retryable: false,
      reason: "The requested Search Console property was not found for this service account.",
      remedy: "Check GSC_SITE_URL exactly matches a property the service account can see (run `npm run gsc:doctor`). Domain properties use the `sc-domain:` prefix.",
      raw,
    };
  }

  // 6. Invalid / rejected credential (bad key bytes, disabled key, clock skew).
  if (status === 401 || /invalid_grant|unauthorized_client|invalid_client|invalid authentication|UNAUTHENTICATED|Invalid JWT|account not found/i.test(combined)) {
    return {
      code: "AUTH_INVALID_KEY",
      retryable: false,
      reason: "Google rejected the service-account credentials (invalid, disabled, revoked, or clock skew).",
      remedy: "Verify the service-account key is active in Google Cloud and the machine clock is not skewed. Regenerate the key and update GOOGLE_SERVICE_ACCOUNT_B64 if needed.",
      raw,
    };
  }

  return {
    code: "UNKNOWN",
    retryable: false,
    reason: "Unclassified Search Console error.",
    remedy: "Inspect the raw error below and run `npm run gsc:doctor` for a full auth/permission check.",
    raw,
  };
}
