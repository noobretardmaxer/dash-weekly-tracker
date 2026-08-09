/* eslint-disable no-console */
/**
 * gsc:daily — the scheduled incremental Search Console sync. Re-fetches the
 * trailing window (default 5 days, dataState=all) and upserts, so the freshest
 * numbers land and late revisions are absorbed. Idempotent; safe to re-run.
 *
 *   npm run gsc:daily
 *   npm run gsc:daily -- --trailing-days=5 --property=https://hydradb.com/
 *
 * Locally: node --env-file=.env --import tsx scripts/gsc-sync.ts
 */
import { prisma } from "../src/db/prisma-client";
import { runDaily, type SearchType } from "../src/integrations/gsc/sync";

function parseArgs(argv: string[]): { trailingDays?: number; properties: string[]; searchTypes?: SearchType[]; throttleMs?: number } {
  const properties: string[] = [];
  const searchTypes: SearchType[] = [];
  const flags: Record<string, string> = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=");
    if (key === "property" && value) properties.push(value);
    else if (key === "search-type" && value) searchTypes.push(value as SearchType);
    else if (value !== undefined) flags[key] = value;
  }
  return {
    trailingDays: flags["trailing-days"] ? Number(flags["trailing-days"]) : undefined,
    throttleMs: flags["throttle-ms"] ? Number(flags["throttle-ms"]) : undefined,
    searchTypes: searchTypes.length ? searchTypes : undefined,
    properties,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  console.log("GSC daily sync — trailing window, dataState=all (provisional)...");
  const summary = await runDaily({
    trailingDays: args.trailingDays,
    throttleMs: args.throttleMs,
    searchTypes: args.searchTypes,
    properties: args.properties.length ? args.properties : undefined,
  });

  console.log(`\nRange: ${summary.startYmd} → ${summary.endYmd}`);
  if (summary.results.length === 0) {
    console.error("No properties to sync (run gsc:doctor).");
    process.exitCode = 1;
  }
  for (const r of summary.results) {
    const line = `  ${r.siteUrl.padEnd(32)} ${r.status.toUpperCase().padEnd(8)} rows=${r.rowsWritten}`;
    if (r.status === "failed") console.error(`${line}  ${r.error ?? ""}`);
    else console.log(line);
  }
  if (summary.results.some((r) => r.status === "failed")) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("gsc:daily failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
