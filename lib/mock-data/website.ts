import { faker } from "@faker-js/faker";
import { SEEDS } from "./seed";
import { generateTimeSeries } from "./utils";
import type { ShareSlice, FunnelStep } from "./types";

faker.seed(SEEDS.website);

export const visitorsSeries = generateTimeSeries({
  baseValue: 3400,
  volatility: 0.14,
  trendPct: 22,
  weekendFactor: 0.82,
});

export const uniqueVisitorsSeries = visitorsSeries.map((p) => ({
  date: p.date,
  value: Math.round(p.value * faker.number.float({ min: 0.62, max: 0.72, fractionDigits: 2 })),
}));

export const returningVisitorsSeries = visitorsSeries.map((p, i) => ({
  date: p.date,
  value: Math.max(0, p.value - uniqueVisitorsSeries[i].value),
}));

export const signupsSeries = generateTimeSeries({
  baseValue: 55,
  volatility: 0.25,
  trendPct: 30,
  weekendFactor: 0.75,
  minValue: 5,
});

export const activationRateSeries = generateTimeSeries({
  baseValue: 27,
  volatility: 0.15,
  trendPct: -8,
  minValue: 12,
  round: false,
});

export const avgSessionDurationSeries = generateTimeSeries({
  baseValue: 210,
  volatility: 0.1,
  trendPct: 6,
  minValue: 60,
});

export const bounceRateSeries = generateTimeSeries({
  baseValue: 46,
  volatility: 0.08,
  trendPct: -6,
  minValue: 20,
  round: false,
});

export const trafficSources: ShareSlice[] = [
  { name: "Organic Search", value: 42 },
  { name: "Direct", value: 23 },
  { name: "Referral", value: 15 },
  { name: "Social", value: 11 },
  { name: "Email", value: 6 },
  { name: "Paid", value: 3 },
];

export const deviceBreakdown: ShareSlice[] = [
  { name: "Desktop", value: 58 },
  { name: "Mobile", value: 36 },
  { name: "Tablet", value: 6 },
];

export const countryBreakdown: ShareSlice[] = [
  { name: "United States", value: 34 },
  { name: "India", value: 18 },
  { name: "United Kingdom", value: 9 },
  { name: "Germany", value: 8 },
  { name: "Canada", value: 6 },
  { name: "Brazil", value: 5 },
  { name: "Other", value: 20 },
];

export const activationFunnel: FunnelStep[] = [
  { name: "Website Visitors", value: 100 },
  { name: "Signed Up", value: 8.4 },
  { name: "Activated", value: 4.9 },
  { name: "Retained (W2)", value: 3.1 },
];

export const conversionFunnel: FunnelStep[] = [
  { name: "Landing Page", value: 100 },
  { name: "Docs / Pricing", value: 41 },
  { name: "Signup Started", value: 18 },
  { name: "Signup Completed", value: 11 },
  { name: "Activated", value: 6.4 },
];

const PAGE_PATHS = [
  "/",
  "/docs/getting-started",
  "/pricing",
  "/blog/graphrag-explained",
  "/product/vector-search",
  "/product/graph-database",
  "/compare/neo4j-alternative",
  "/blog/hybrid-search-guide",
  "/customers",
  "/docs/api-reference",
];

export const topLandingPages = PAGE_PATHS.slice(0, 8).map((page) => {
  const visitors = faker.number.int({ min: 800, max: 9000 });
  return {
    page,
    visitors,
    bounceRate: faker.number.float({ min: 28, max: 62, fractionDigits: 1 }),
    avgTimeSeconds: faker.number.int({ min: 45, max: 340 }),
  };
}).sort((a, b) => b.visitors - a.visitors);

export const topExitPages = PAGE_PATHS.slice(2).map((page) => {
  const exits = faker.number.int({ min: 200, max: 4200 });
  return {
    page,
    exits,
    exitRate: faker.number.float({ min: 12, max: 58, fractionDigits: 1 }),
  };
}).sort((a, b) => b.exits - a.exits);
