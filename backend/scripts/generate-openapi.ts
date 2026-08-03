import fs from "fs";
import path from "path";
import { z } from "zod";
import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

// eslint-disable-next-line import/first
import { dateRangeSchema, compareSchema } from "../src/api/utils/query-parser";

const registry = new OpenAPIRegistry();

const overviewQuery = dateRangeSchema.merge(compareSchema);

const DOMAINS = ["dashboard", "website", "search-console", "seo", "twitter", "reddit", "discord", "blog", "reports", "settings", "alerts"];

for (const domain of DOMAINS) {
  registry.registerPath({
    method: "get",
    path: `/api/v1/${domain}`,
    description: `Composite overview / list endpoint for the ${domain} domain. Supports date-range (\`days\` or \`from\`/\`to\`), comparison (\`compare\`), and — where the endpoint is a list — pagination, sorting, and filtering query params.`,
    summary: `Get ${domain} data`,
    request: { query: overviewQuery },
    responses: {
      200: { description: "Success" },
    },
    tags: [domain],
  });
}

registry.registerPath({
  method: "get",
  path: "/api/v1/health",
  description: "Health check: database, redis, scheduler, and per-integration circuit-breaker state.",
  summary: "Health check",
  responses: { 200: { description: "OK" }, 503: { description: "Degraded" } },
  tags: ["health"],
});

const generator = new OpenApiGeneratorV3(registry.definitions);
const document = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "HydraDB Growth Dashboard API",
    version: "0.1.0",
    description:
      "Internal analytics platform API. See README.md for how to run in MOCK_MODE (default) or connect real integrations.",
  },
  servers: [{ url: "/api/v1" }],
});

const outPath = path.join(__dirname, "..", "openapi", "openapi.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(document, null, 2));
console.log(`Wrote OpenAPI document to ${outPath}`);
