import { createHttpClient } from "../shared/http-client";
import { IntegrationFetchError } from "../../lib/errors";
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

export function createSemrushClient(): SemrushClient {
  const http = createHttpClient("https://api.semrush.com", {
    Accept: "text/plain",
  });
  const apiKey = env.SEMRUSH_API_KEY ?? "";
  const target = env.SEMRUSH_TARGET;
  const database = env.SEMRUSH_DATABASE;

  async function authenticate(): Promise<void> {
    if (!env.SEMRUSH_API_KEY) {
      throw new IntegrationFetchError("semrush", "SEMRUSH_API_KEY not configured");
    }
    try {
      await http.get("/", {
        params: { type: "domain_ranks", key: apiKey, domain: target, database },
        responseType: "text",
      });
    } catch (error) {
      throw new IntegrationFetchError("semrush", (error as Error).message);
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
          domainRating: overview.authorityScore,
          backlinks: backlinks.total,
        };
      })
    );
  }

  async function fetch(_range: { from: Date; to: Date }): Promise<SemrushRawPayload> {
    try {
      const [overview, backlinks, organicRes, refDomains, anchors, tlds] = await Promise.all([
        fetchDomainOverview(target),
        fetchBacklinksOverview(target),
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
        }),
        fetchBacklinksRefdomains(target),
        fetchBacklinksAnchors(target),
        fetchBacklinksTld(target),
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

      const competitorProfiles = await fetchCompetitorProfiles();

      return {
        organicTraffic: overview.organicTraffic,
        organicKeywords: overview.organicKeywords,
        domainRating: overview.authorityScore,
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
      throw new IntegrationFetchError("semrush", (error as Error).message);
    }
  }

  return { authenticate, fetch };
}
