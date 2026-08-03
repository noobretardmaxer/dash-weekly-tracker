import { createHttpClient } from "../shared/http-client";
import { IntegrationFetchError } from "../../lib/errors";
import { env } from "../../lib/env";
import type {
  AhrefsClient,
  AhrefsRawPayload,
  CompetitorProfileRow,
  KeywordMovement,
  KeywordRankingRow,
  SeoTopPage,
} from "./types";

/** Competitor domains we track alongside our own (see lib/constants/competitors.ts). */
const COMPETITOR_DOMAINS: { name: string; domain: string }[] = [
  { name: "Neo4j", domain: "neo4j.com" },
  { name: "Weaviate", domain: "weaviate.io" },
  { name: "Qdrant", domain: "qdrant.tech" },
  { name: "Memgraph", domain: "memgraph.com" },
  { name: "Pinecone", domain: "pinecone.io" },
  { name: "FalkorDB", domain: "falkordb.com" },
];

type DomainRatingResponse = { domain_rating: number };
type OverviewMetricsResponse = { metrics: { org_traffic: number; org_keywords: number } };
type BacklinksStatsResponse = {
  metrics: { live: number; live_refdomains: number; new_backlinks: number; lost_backlinks: number };
};
type TopPagesResponse = {
  pages: { url: string; sum_traffic: number; keywords: number; top_keyword_position: number }[];
};
type RankTrackerResponse = {
  keywords: {
    keyword: string;
    position: number;
    previous_position: number;
    volume: number;
    keyword_difficulty: number;
    clicks: number;
    ctr: number;
    url: string;
  }[];
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Real Ahrefs integration, built against Ahrefs' documented API v3
 * (https://ahrefs.com/api/documentation). Bearer-token auth, all reads
 * scoped to a single `target` domain (env.AHREFS_TARGET). Ahrefs' API
 * returns point-in-time snapshot metrics for a target, not a client-side
 * date range series, so `fetch` ignores the requested range and always
 * pulls the current snapshot.
 */
export function createAhrefsClient(): AhrefsClient {
  const http = createHttpClient("https://api.ahrefs.com", {
    Authorization: `Bearer ${env.AHREFS_API_TOKEN ?? ""}`,
    "Content-Type": "application/json",
  });
  const target = env.AHREFS_TARGET;

  async function authenticate(): Promise<void> {
    if (!env.AHREFS_API_TOKEN) {
      throw new IntegrationFetchError("ahrefs", "AHREFS_API_TOKEN not configured");
    }
    try {
      await http.get("/v3/site-explorer/domain-rating", { params: { target, date: isoDate(new Date()) } });
    } catch (error) {
      throw new IntegrationFetchError("ahrefs", (error as Error).message);
    }
  }

  async function fetchCompetitorProfiles(date: string): Promise<CompetitorProfileRow[]> {
    return Promise.all(
      COMPETITOR_DOMAINS.map(async ({ name, domain }) => {
        const [domainRatingRes, metricsRes, backlinksStatsRes] = await Promise.all([
          http.get<DomainRatingResponse>("/v3/site-explorer/domain-rating", { params: { target: domain, date } }),
          http.get<OverviewMetricsResponse>("/v3/site-explorer/metrics", {
            params: { target: domain, date, mode: "subdomains" },
          }),
          http.get<BacklinksStatsResponse>("/v3/site-explorer/backlinks-stats", {
            params: { target: domain, date, mode: "subdomains" },
          }),
        ]);
        return {
          competitorDomain: name,
          organicTraffic: metricsRes.data.metrics.org_traffic,
          organicKeywords: metricsRes.data.metrics.org_keywords,
          domainRating: domainRatingRes.data.domain_rating,
          backlinks: backlinksStatsRes.data.metrics.live,
        };
      })
    );
  }

  async function fetch(_range: { from: Date; to: Date }): Promise<AhrefsRawPayload> {
    const date = isoDate(new Date());

    try {
      const [domainRatingRes, metricsRes, backlinksStatsRes, topPagesRes, rankTrackerRes] = await Promise.all([
        http.get<DomainRatingResponse>("/v3/site-explorer/domain-rating", { params: { target, date } }),
        http.get<OverviewMetricsResponse>("/v3/site-explorer/metrics", { params: { target, date, mode: "subdomains" } }),
        http.get<BacklinksStatsResponse>("/v3/site-explorer/backlinks-stats", {
          params: { target, date, mode: "subdomains" },
        }),
        http.get<TopPagesResponse>("/v3/site-explorer/top-pages", {
          params: { target, date, mode: "subdomains", limit: 8 },
        }),
        http.get<RankTrackerResponse>("/v3/rank-tracker/overview", { params: { target, country: "us" } }),
      ]);

      const seoTopPages: SeoTopPage[] = topPagesRes.data.pages.map((p) => ({
        page: p.url,
        organicTraffic: p.sum_traffic,
        keywords: p.keywords,
        avgPosition: p.top_keyword_position,
      }));

      const keywordRankings: KeywordRankingRow[] = rankTrackerRes.data.keywords.map((k) => ({
        keyword: k.keyword,
        currentPosition: k.position,
        previousPosition: k.previous_position,
        movement: k.previous_position - k.position,
        searchVolume: k.volume,
        difficulty: k.keyword_difficulty,
        clicks: k.clicks,
        ctr: k.ctr,
        landingPage: k.url,
      }));

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

      const competitorProfiles = await fetchCompetitorProfiles(date);

      return {
        organicTraffic: metricsRes.data.metrics.org_traffic,
        organicKeywords: metricsRes.data.metrics.org_keywords,
        domainRating: domainRatingRes.data.domain_rating,
        backlinks: backlinksStatsRes.data.metrics.live,
        referringDomains: backlinksStatsRes.data.metrics.live_refdomains,
        newBacklinks: backlinksStatsRes.data.metrics.new_backlinks,
        lostBacklinks: backlinksStatsRes.data.metrics.lost_backlinks,
        seoTopPages,
        fastestGrowingKeywords,
        losingKeywords,
        keywordRankings,
        competitorProfiles,
      };
    } catch (error) {
      throw new IntegrationFetchError("ahrefs", (error as Error).message);
    }
  }

  return { authenticate, fetch };
}
