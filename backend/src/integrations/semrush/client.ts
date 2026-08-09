import { isAxiosError } from "axios";
import { createHttpClient } from "../shared/http-client";
import { IntegrationFetchError, IntegrationNotConfiguredError } from "../../lib/errors";
import { env } from "../../lib/env";
import type {
  SemrushClient,
  SemrushRawPayload,
  CompetitorProfileRow,
  KeywordMovement,
  KeywordRankingRow,
  SeoTopPage,
  RefDomainRow,
  AnchorRow,
  TldRow,
  AuthorityBucket,
} from "./types";

const COMPETITOR_DOMAINS: { name: string; domain: string }[] = [
  { name: "Neo4j", domain: "neo4j.com" },
  { name: "Weaviate", domain: "weaviate.io" },
  { name: "Qdrant", domain: "qdrant.tech" },
  { name: "Memgraph", domain: "memgraph.com" },
  { name: "Pinecone", domain: "pinecone.io" },
  { name: "FalkorDB", domain: "falkordb.com" },
];

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(";");
  return lines.slice(1).map((line) => {
    const values = line.split(";");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] ?? "").trim();
    });
    return row;
  });
}

function num(val: string | undefined): number {
  if (!val) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Runs a single named Semrush report and, on failure, rethrows an
 * IntegrationFetchError tagged with the report name and HTTP status — so the
 * sync log says "backlinks_overview: HTTP 403" instead of a bare stack trace,
 * and you can tell which report broke. Never retried at this layer; the shared
 * http-client only retries network/5xx, never a 4xx like 403.
 */
async function withReport<T>(report: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const suffix = status !== undefined ? ` HTTP ${status}` : "";
    throw new IntegrationFetchError("semrush", `${report}${suffix}: ${(error as Error).message}`);
  }
}

export function createSemrushClient(): SemrushClient {
  const http = createHttpClient("https://api.semrush.com", {
    Accept: "text/plain",
  });
  // Trim to defend against a trailing newline/space from a copy-pasted .env value,
  // which otherwise sends `?key=<KEY>\n` and 403s.
  const apiKey = (env.SEMRUSH_API_KEY ?? "").trim();
  const target = env.SEMRUSH_TARGET;
  const database = env.SEMRUSH_DATABASE;

  /**
   * Free (non-unit-consuming) endpoint that both validates the key and returns
   * the remaining API unit balance. Semrush returns a bare integer on success or
   * an "ERROR nn :: ..." string on an invalid key.
   */
  async function checkApiUnits(): Promise<number> {
    const res = await http.get<string>("/users/countapiunits.html", {
      params: { key: apiKey },
      responseType: "text",
    });
    const text = String(res.data).trim();
    const balance = Number(text);
    if (!Number.isFinite(balance)) {
      // Invalid/forbidden key — Semrush returns "ERROR 135 :: ..." here.
      throw new IntegrationFetchError("semrush", `unit check failed: ${text.slice(0, 120)}`);
    }
    return balance;
  }

  async function authenticate(): Promise<void> {
    if (!apiKey) {
      // Not a fetch failure — the integration was simply never configured. The
      // orchestrator treats this as skipped (no sync-failure alert) and the UI
      // shows an honest empty state.
      throw new IntegrationNotConfiguredError("semrush", "SEMRUSH_API_KEY not set");
    }
    // Preflight the unit balance so a zero balance fails fast with a clear message
    // instead of 403-ing every report and burning the run. Never retry a 403 — it
    // is a config error, not transient.
    const balance = await withReport("countapiunits", checkApiUnits);
    if (balance <= 0) {
      throw new IntegrationFetchError("semrush", `no API units remaining (balance ${balance})`);
    }
  }

  async function fetchDomainOverview(domain: string): Promise<{
    authorityScore: number;
    organicTraffic: number;
    organicKeywords: number;
  }> {
    const res = await http.get<string>("/", {
      params: {
        type: "domain_ranks",
        key: apiKey,
        domain,
        database,
        export_columns: "Or,Ot,As",
      },
      responseType: "text",
    });
    const rows = parseCsv(res.data);
    const row = rows[0] ?? {};
    return {
      authorityScore: num(row["As"]),
      organicTraffic: num(row["Ot"]),
      organicKeywords: num(row["Or"]),
    };
  }

  async function fetchBacklinksOverview(domain: string): Promise<{
    total: number;
    referringDomains: number;
    newBacklinks: number;
    lostBacklinks: number;
  }> {
    const res = await http.get<string>("/analytics/v1/", {
      params: {
        type: "backlinks_overview",
        key: apiKey,
        target: domain,
        target_type: "root_domain",
        export_columns: "total,domains_num,new_backlinks_7d,lost_backlinks_7d",
      },
      responseType: "text",
    });
    const rows = parseCsv(res.data);
    const row = rows[0] ?? {};
    return {
      total: num(row["total"]),
      referringDomains: num(row["domains_num"]),
      newBacklinks: num(row["new_backlinks_7d"]),
      lostBacklinks: num(row["lost_backlinks_7d"]),
    };
  }

  async function fetchBacklinksRefdomains(domain: string): Promise<RefDomainRow[]> {
    const res = await http.get<string>("/analytics/v1/", {
      params: {
        type: "backlinks_refdomains",
        key: apiKey,
        target: domain,
        target_type: "root_domain",
        export_columns: "domain_ascore,backlinks_num,domain",
        display_limit: 500,
        display_sort: "domain_ascore_desc",
      },
      responseType: "text",
    });
    return parseCsv(res.data).map((r) => ({
      domain: r["domain"] ?? "",
      authorityScore: num(r["domain_ascore"]),
      backlinksCount: num(r["backlinks_num"]),
    }));
  }

  async function fetchBacklinksAnchors(domain: string): Promise<AnchorRow[]> {
    const res = await http.get<string>("/analytics/v1/", {
      params: {
        type: "backlinks_anchors",
        key: apiKey,
        target: domain,
        target_type: "root_domain",
        export_columns: "anchor,backlinks_num,domains_num",
        display_limit: 20,
        display_sort: "backlinks_num_desc",
      },
      responseType: "text",
    });
    return parseCsv(res.data).map((r) => ({
      anchor: r["anchor"] ?? "",
      backlinksCount: num(r["backlinks_num"]),
      domainsCount: num(r["domains_num"]),
    }));
  }

  async function fetchBacklinksTld(domain: string): Promise<TldRow[]> {
    const res = await http.get<string>("/analytics/v1/", {
      params: {
        type: "backlinks_tld",
        key: apiKey,
        target: domain,
        target_type: "root_domain",
        export_columns: "zone,domains_num,backlinks_num",
        display_limit: 20,
        display_sort: "backlinks_num_desc",
      },
      responseType: "text",
    });
    return parseCsv(res.data).map((r) => ({
      tld: r["zone"] ?? "",
      backlinksCount: num(r["backlinks_num"]),
      domainsCount: num(r["domains_num"]),
    }));
  }

  function bucketByAuthority(refDomains: RefDomainRow[]): AuthorityBucket[] {
    const buckets = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];
    for (const rd of refDomains) {
      const score = rd.authorityScore;
      if (score <= 20) buckets[0].count++;
      else if (score <= 40) buckets[1].count++;
      else if (score <= 60) buckets[2].count++;
      else if (score <= 80) buckets[3].count++;
      else buckets[4].count++;
    }
    return buckets;
  }

  async function fetchCompetitorProfiles(): Promise<CompetitorProfileRow[]> {
    return Promise.all(
      COMPETITOR_DOMAINS.map(async ({ name, domain }) => {
        const [overview, backlinks] = await Promise.all([
          fetchDomainOverview(domain),
          fetchBacklinksOverview(domain),
        ]);
        return {
          competitorDomain: name,
          organicTraffic: overview.organicTraffic,
          organicKeywords: overview.organicKeywords,
          authorityScore: overview.authorityScore,
          backlinks: backlinks.total,
        };
      })
    );
  }

  async function fetch(_range: { from: Date; to: Date }): Promise<SemrushRawPayload> {
    try {
      const [overview, backlinks, organicRes, refDomains, anchors, tlds] = await Promise.all([
        withReport("domain_ranks", () => fetchDomainOverview(target)),
        withReport("backlinks_overview", () => fetchBacklinksOverview(target)),
        withReport("domain_organic", () =>
          http.get<string>("/", {
            params: {
              type: "domain_organic",
              key: apiKey,
              domain: target,
              database,
              display_limit: 50,
              display_sort: "tr_desc",
              export_columns: "Ph,Po,Pp,Nq,Kd,Tr,Ur",
            },
            responseType: "text",
          })
        ),
        withReport("backlinks_refdomains", () => fetchBacklinksRefdomains(target)),
        withReport("backlinks_anchors", () => fetchBacklinksAnchors(target)),
        withReport("backlinks_tld", () => fetchBacklinksTld(target)),
      ]);

      const organicRows = parseCsv(organicRes.data);

      const keywordRankings: KeywordRankingRow[] = organicRows.map((r) => {
        const currentPosition = num(r["Po"]);
        const previousPosition = num(r["Pp"]);
        const searchVolume = num(r["Nq"]);
        const traffic = num(r["Tr"]);
        const ctr = searchVolume > 0 ? Number(((traffic / searchVolume) * 100).toFixed(1)) : 0;
        return {
          keyword: r["Ph"] ?? "",
          currentPosition,
          previousPosition,
          movement: previousPosition - currentPosition,
          searchVolume,
          difficulty: num(r["Kd"]),
          clicks: Math.round(traffic),
          ctr,
          landingPage: r["Ur"] ?? "",
        };
      });

      const pageTraffic = new Map<string, { traffic: number; keywords: number; positions: number[] }>();
      for (const r of organicRows) {
        const url = r["Ur"] ?? "";
        const entry = pageTraffic.get(url) ?? { traffic: 0, keywords: 0, positions: [] };
        entry.traffic += num(r["Tr"]);
        entry.keywords += 1;
        entry.positions.push(num(r["Po"]));
        pageTraffic.set(url, entry);
      }
      const seoTopPages: SeoTopPage[] = [...pageTraffic.entries()]
        .map(([page, data]) => ({
          page,
          organicTraffic: Math.round(data.traffic),
          keywords: data.keywords,
          avgPosition: Number((data.positions.reduce((a, b) => a + b, 0) / data.positions.length).toFixed(1)),
        }))
        .sort((a, b) => b.organicTraffic - a.organicTraffic)
        .slice(0, 8);

      const fastestGrowingKeywords: KeywordMovement[] = [...keywordRankings]
        .filter((k) => k.movement > 0)
        .sort((a, b) => b.movement - a.movement)
        .slice(0, 6)
        .map((k) => ({ keyword: k.keyword, positionChange: k.movement, currentPosition: k.currentPosition }));

      const losingKeywords: KeywordMovement[] = [...keywordRankings]
        .filter((k) => k.movement < 0)
        .sort((a, b) => a.movement - b.movement)
        .slice(0, 6)
        .map((k) => ({ keyword: k.keyword, positionChange: k.movement, currentPosition: k.currentPosition }));

      const competitorProfiles = await withReport("competitors", fetchCompetitorProfiles);

      return {
        organicTraffic: overview.organicTraffic,
        organicKeywords: overview.organicKeywords,
        authorityScore: overview.authorityScore,
        backlinks: backlinks.total,
        referringDomains: backlinks.referringDomains,
        newBacklinks: backlinks.newBacklinks,
        lostBacklinks: backlinks.lostBacklinks,
        seoTopPages,
        fastestGrowingKeywords,
        losingKeywords,
        keywordRankings,
        competitorProfiles,
        refDomainsByAuthority: bucketByAuthority(refDomains),
        topRefDomains: refDomains.slice(0, 50),
        topAnchors: anchors,
        topTlds: tlds,
      };
    } catch (error) {
      // Report-level failures are already tagged (report name + HTTP status) by
      // withReport; pass them through untouched. Only wrap anything else.
      if (error instanceof IntegrationFetchError) throw error;
      throw new IntegrationFetchError("semrush", (error as Error).message);
    }
  }

  return { authenticate, fetch };
}
