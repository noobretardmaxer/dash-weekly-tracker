/* eslint-disable no-console */
/**
 * gsc:backfill — one-time historical load of Search Console data into Postgres.
 *
 *   npm run gsc:backfill -- --estimate                 # offline quota pre-flight, no Google calls
 *   npm run gsc:backfill                                # 16 months, all properties, web
 *   npm run gsc:backfill -- --months=6 --property=sc-domain:hydradb.com
 *   npm run gsc:backfill -- --window-days=90 --throttle-ms=250
 *
 * Locally: node --env-file=.env --import tsx scripts/gsc-backfill.ts -- --estimate
 */
import { prisma } from "../src/db/prisma-client";
import { estimateBackfill, runBackfill, type SearchType } from "../src/integrations/gsc/sync";

interface ParsedArgs {
  months?: number;
  windowDays?: number;
  throttleMs?: number;
  searchTypes?: SearchType[];
  properties: string[];
  estimate: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const properties: string[] = [];
  const searchTypes: SearchType[] = [];
  const flags: Record<string, string> = {};
  let estimate = false;
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=");
    if (key === "property" && value) properties.push(value);
    else if (key === "search-type" && value) searchTypes.push(value as SearchType);
    else if (key === "estimate") estimate = true;
    else if (value !== undefined) flags[key] = value;
  }
  return {
    months: flags.months ? Number(flags.months) : undefined,
    windowDays: flags["window-days"] ? Number(flags["window-days"]) : undefined,
    throttleMs: flags["throttle-ms"] ? Number(flags["throttle-ms"]) : undefined,
    searchTypes: searchTypes.length ? searchTypes : undefined,
    properties,
    estimate,
  };
}

function printEstimate(args: ParsedArgs): void {
  const properties = args.properties.length || 2; // domain + url-prefix by default
  const est = estimateBackfill({
    properties,
    searchTypes: args.searchTypes?.length ?? 1,
    months: args.months,
    windowDays: args.windowDays,
    throttleMs: args.throttleMs,
  });
  console.log("GSC backfill — quota pre-flight (estimate, no Google calls made)");
  console.log("================================================================");
  console.log(`Scope:            ${est.properties} propert${est.properties === 1 ? "y" : "ies"} × ${est.searchTypes} search type(s) × ${est.months} months`);
  console.log(`Windowing:        ${est.windowsPerProperty} windows/property (${est.windowDays}-day windows), ${est.pullsPerWindow} pulls/window`);
  console.log(`Logical pulls:    ${est.logicalPulls}  (1 totals + 5 dimension pulls, combined [date,<dim>])`);
  console.log(`HTTP requests:    min ${est.requestsMin}  /  typical ~${est.requestsTypical}  /  worst-case ${est.requestsMax}`);
  console.log(`                  (typical assumes ~2 paginated pages/pull; worst-case ~8)`);
  console.log(`Throttle:         ${est.throttleMs}ms between requests`);
  console.log(`Est. wall-clock:  ~${est.wallClockSecTypical}s typical  /  ~${est.wallClockSecMax}s worst-case`);
  console.log(`Quota headroom:   peak ~${est.peakQpmUsagePct}% of the ~${est.softQpmPerProperty} QPM/property soft limit (requests are serialised)`);
  console.log("");
  console.log("For comparison, the naive day-by-day-per-dimension approach would be ~"
    + `${properties * (args.searchTypes?.length ?? 1) * 5 * Math.round((args.months ?? 16) * 30.44)} requests.`);
  console.log("Run without --estimate to execute.");
}

async function printRowCounts(): Promise<void> {
  const [properties, totals, dims, runs] = await Promise.all([
    prisma.gscProperty.count(),
    prisma.gscDailyTotal.count(),
    prisma.gscDimensionDaily.count(),
    prisma.gscSyncRun.count(),
  ]);
  console.log("\nRows now in the database:");
  console.log(`  gsc_properties:      ${properties}`);
  console.log(`  gsc_daily_totals:    ${totals}`);
  console.log(`  gsc_dimension_daily: ${dims}`);
  console.log(`  gsc_sync_runs:       ${runs}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.estimate) {
    printEstimate(args);
    return;
  }

  console.log("GSC backfill — starting (reading from Google, writing to Postgres)...");
  const summary = await runBackfill({
    months: args.months,
    windowDays: args.windowDays,
    throttleMs: args.throttleMs,
    searchTypes: args.searchTypes,
    properties: args.properties.length ? args.properties : undefined,
  });

  console.log(`\nRange: ${summary.startYmd} → ${summary.endYmd}`);
  if (summary.results.length === 0) {
    console.error("No properties to sync — the service account can see none (run gsc:doctor).");
    process.exitCode = 1;
  }
  for (const r of summary.results) {
    const line = `  ${r.siteUrl.padEnd(32)} ${r.status.toUpperCase().padEnd(8)} rows=${r.rowsWritten}`;
    if (r.status === "failed") console.error(`${line}  ${r.error ?? ""}`);
    else console.log(`${line}${r.failedSegments.length ? `  (partial: ${r.failedSegments.length} segment(s) failed)` : ""}`);
  }
  await printRowCounts();
  if (summary.results.some((r) => r.status === "failed")) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("gsc:backfill failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
