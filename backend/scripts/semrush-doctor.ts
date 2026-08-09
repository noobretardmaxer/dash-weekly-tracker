/**
 * Standalone Semrush diagnostic — run BEFORE blaming app code for a 403 or empty
 * SEO dashboard. Reads process.env directly (no DB/Redis needed) so it works in
 * any environment.
 *
 *   npm run semrush:doctor
 *   # or: node --env-file=.env --import tsx scripts/semrush-doctor.ts
 *
 * It checks, in order: key present → API unit balance (free call, also validates
 * the key) → a live domain_ranks call for the target. Every failure is classified
 * (NO_KEY / NO_UNITS / FORBIDDEN / NETWORK / EMPTY) and printed — never a raw
 * stack trace. Exit 0 = healthy or not-configured (the expected honest state with
 * no key); exit 1 = an actionable problem.
 */
import axios, { isAxiosError } from "axios";

const BASE = "https://api.semrush.com";
const key = (process.env.SEMRUSH_API_KEY ?? "").trim();
const target = process.env.SEMRUSH_TARGET ?? "hydradb.com";
const database = process.env.SEMRUSH_DATABASE ?? "us";

const http = axios.create({ baseURL: BASE, timeout: 15_000, headers: { Accept: "text/plain" } });

function classifyAxios(error: unknown): { code: string; detail: string } {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403) return { code: "FORBIDDEN", detail: "HTTP 403 — invalid key, wrong API version, or key lacks permission" };
    if (status !== undefined) return { code: "HTTP_ERROR", detail: `HTTP ${status}` };
    return { code: "NETWORK", detail: error.message };
  }
  return { code: "NETWORK", detail: error instanceof Error ? error.message : String(error) };
}

function fail(code: string, detail: string): never {
  console.error(`\n✖ FAIL [${code}] ${detail}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log(`Semrush doctor — target=${target} database=${database}`);
  console.log(`Key: ${key ? `present (${key.length} chars, …${key.slice(-4)})` : "MISSING"}`);

  if (!key) {
    console.log(
      "\n⚠ NOT CONFIGURED [NO_KEY] SEMRUSH_API_KEY is not set.\n" +
        "  This is the expected honest state — the SEO section will render empty\n" +
        "  states (no fabricated numbers) until a key with API units is provided."
    );
    process.exit(0);
  }

  // 1) Unit balance (free; also validates the key).
  let balance: number;
  try {
    const res = await http.get<string>("/users/countapiunits.html", { params: { key }, responseType: "text" });
    const text = String(res.data).trim();
    balance = Number(text);
    if (!Number.isFinite(balance)) fail("FORBIDDEN", `unit check returned "${text.slice(0, 120)}" (likely an invalid key)`);
    console.log(`Units: ${balance.toLocaleString()} remaining`);
    if (balance <= 0) fail("NO_UNITS", "API unit balance is 0 — top up the Semrush API plan");
  } catch (error) {
    const { code, detail } = classifyAxios(error);
    fail(code, `unit check failed — ${detail}`);
  }

  // 2) Live domain overview for the target.
  try {
    const res = await http.get<string>("/", {
      params: { type: "domain_ranks", key, domain: target, database, export_columns: "Or,Ot,As" },
      responseType: "text",
    });
    const text = String(res.data).trim();
    if (!text) fail("EMPTY", `domain_ranks returned an empty body for ${target}/${database}`);
    const lines = text.split("\n");
    if (lines.length < 2) fail("EMPTY", `domain_ranks returned no data rows: "${text.slice(0, 120)}"`);
    const headers = lines[0].split(";").map((h) => h.trim());
    const values = lines[1].split(";").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ""));
    console.log(
      `Live domain_ranks: authorityScore(As)=${row["As"] ?? "?"} organicKeywords(Or)=${row["Or"] ?? "?"} organicTraffic(Ot)=${row["Ot"] ?? "?"}`
    );
  } catch (error) {
    const { code, detail } = classifyAxios(error);
    fail(code, `domain_ranks failed — ${detail}`);
  }

  console.log("\n✓ PASS — key valid, units available, live data reachable.");
  process.exit(0);
}

main().catch((error) => {
  // Never surface a raw stack trace.
  const { code, detail } = classifyAxios(error);
  fail(code, detail);
});
