/**
 * Build-time guard for the repo's "No Mock Data — Ever" policy (AGENTS.md),
 * scoped to the SEO/Semrush integration. Fails the build if a mock client is
 * reintroduced under src/integrations/semrush — the two structural signals of
 * fabricated data are a faker import and a file named *mock*.
 *
 * Wired into `npm run build`. There is no CI or test runner in this repo yet, so
 * failing the build is the enforcement point; add this to CI when one exists.
 *
 * (The TypeScript type system is the other guard: SeoMetricRecord.source is the
 * literal "semrush", so writing a "mock" source fails typecheck.)
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const SEO_DIR = join(__dirname, "..", "src", "integrations", "semrush");
const REPO_ROOT = join(__dirname, "..", "..");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const violations: string[] = [];

for (const file of walk(SEO_DIR)) {
  const rel = relative(REPO_ROOT, file);
  if (/mock/i.test(file.split("/").pop() ?? "")) {
    violations.push(`${rel} — mock client files are forbidden in the SEO integration`);
    continue;
  }
  const src = readFileSync(file, "utf8");
  if (/@faker-js\/faker/.test(src)) {
    violations.push(`${rel} — imports @faker-js/faker (fabricated data is forbidden)`);
  }
}

if (violations.length > 0) {
  console.error("✖ No-mock guard failed for src/integrations/semrush:");
  for (const v of violations) console.error(`  - ${v}`);
  console.error("\nSEO must render real Semrush data or an honest empty state — never fabricated numbers.");
  process.exit(1);
}

console.log("✓ No-mock guard passed: SEO/Semrush integration contains no mock/fabricated data.");
