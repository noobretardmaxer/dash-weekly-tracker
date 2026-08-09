/* eslint-disable no-console */
/**
 * gsc:doctor — the tool to reach for whenever Search Console "breaks".
 *
 * It exercises the whole auth path end-to-end and prints a classified verdict:
 *   1. resolve + validate credentials (decodes B64 / cleans the PEM, parses the
 *      key with OpenSSL) and print the service-account email + credential source
 *   2. fetch an access token for the read-only Webmasters scope
 *   3. sites.list — every property the service account can see + permission level
 *   4. a 1-row searchanalytics.query against each property (proves querying works)
 *
 * Any failure is printed as [CODE] reason / remedy / raw — never a bare OpenSSL
 * string — and the process exits non-zero.
 *
 * Run locally:   node --env-file=.env --import tsx scripts/gsc-doctor.ts   (from backend/)
 * Run on Render: npm run gsc:doctor        (as a one-off job / shell; env is already injected)
 */
import { getAccessToken, getCredentialSource, getServiceAccountEmail } from "../src/integrations/gsc/auth";
import { listSites, searchAnalyticsQuery, type SiteEntry } from "../src/integrations/gsc/api";
import { classifyGscError, GscError, type GscErrorInfo } from "../src/integrations/gsc/errors";
import { env } from "../src/lib/env";

function infoOf(error: unknown): GscErrorInfo {
  return error instanceof GscError ? error.info : classifyGscError(error);
}

function printFailure(step: string, error: unknown): void {
  const info = infoOf(error);
  console.error(`\n✗ FAIL at "${step}"  [${info.code}]`);
  console.error(`  Reason: ${info.reason}`);
  console.error(`  Remedy: ${info.remedy}`);
  console.error(`  Raw:    ${info.raw}`);
}

/** A ~30-day window ending today; rowLimit 1 returns the top-click day if any. */
function sampleWindow(): { startDate: string; endDate: string } {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { startDate: iso(start), endDate: iso(end) };
}

async function main(): Promise<void> {
  console.log("HydraDB — Google Search Console Doctor");
  console.log("======================================");

  // 1. Credentials -----------------------------------------------------------
  let email: string;
  try {
    const source = getCredentialSource(); // resolves + validates (OpenSSL parses the key)
    email = getServiceAccountEmail();
    console.log(`Credential source: ${source}`);
    console.log(`Service account:   ${email}`);
    console.log(`Private key:       parsed OK (PKCS#8)`);
    console.log(`Default property:  ${env.GSC_SITE_URL ?? "(GSC_SITE_URL not set)"}`);
  } catch (error) {
    printFailure("resolve credentials", error);
    process.exitCode = 1;
    return;
  }

  // 2. Access token ----------------------------------------------------------
  console.log("\n[1/3] Fetching access token (scope: webmasters.readonly)...");
  try {
    await getAccessToken();
    console.log("      OK");
  } catch (error) {
    printFailure("get access token", error);
    process.exitCode = 1;
    return;
  }

  // 3. sites.list ------------------------------------------------------------
  console.log("\n[2/3] sites.list — properties visible to this service account:");
  let sites: SiteEntry[] = [];
  try {
    sites = await listSites();
  } catch (error) {
    printFailure("sites.list", error);
    process.exitCode = 1;
    return;
  }

  if (sites.length === 0) {
    console.error("      (none)");
    console.error(
      `\n✗ FAIL at "sites.list"  [AUTH_NO_PERMISSION]\n` +
        `  Reason: Auth succeeded but the service account can see no properties.\n` +
        `  Remedy: In Search Console → Settings → Users and permissions, add ${email} with Full permission ` +
        `on sc-domain:hydradb.com AND https://hydradb.com/. This is the step people forget.`
    );
    process.exitCode = 1;
    return;
  }
  for (const site of sites) {
    console.log(`      • ${site.siteUrl.padEnd(32)} permission=${site.permissionLevel}`);
  }

  const configured = env.GSC_SITE_URL;
  if (configured && !sites.some((s) => s.siteUrl === configured)) {
    console.warn(`      ⚠ configured GSC_SITE_URL "${configured}" is NOT in the list above — queries will 403/404.`);
  }

  // 4. Sample query per property --------------------------------------------
  const { startDate, endDate } = sampleWindow();
  console.log(`\n[3/3] Sample searchanalytics.query per property (${startDate} → ${endDate}, 1 row, dataState=all):`);
  let queryFailures = 0;
  for (const site of sites) {
    try {
      const rows = await searchAnalyticsQuery(site.siteUrl, {
        startDate,
        endDate,
        dimensions: ["date"],
        rowLimit: 1,
        dataState: "all",
      });
      if (rows.length === 0) {
        console.log(`      • ${site.siteUrl.padEnd(32)} OK  (0 rows — no data in window, not an error)`);
      } else {
        const r = rows[0];
        console.log(
          `      • ${site.siteUrl.padEnd(32)} OK  date=${r.keys?.[0]} clicks=${r.clicks ?? 0} impressions=${r.impressions ?? 0}`
        );
      }
    } catch (error) {
      queryFailures += 1;
      const info = infoOf(error);
      console.error(`      • ${site.siteUrl.padEnd(32)} FAIL [${info.code}] ${info.reason}`);
    }
  }

  // Verdict ------------------------------------------------------------------
  const queryable = sites.length - queryFailures;
  console.log("\n--------------------------------------");
  if (queryFailures === 0) {
    console.log(`RESULT: PASS  (${queryable}/${sites.length} properties queryable)`);
  } else {
    console.error(`RESULT: PARTIAL  (${queryable}/${sites.length} properties queryable, ${queryFailures} failed)`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  printFailure("unexpected", error);
  process.exitCode = 1;
});
