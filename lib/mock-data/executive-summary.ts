import { faker } from "@faker-js/faker";
import { SEEDS } from "./seed";
import { sliceLastNDays, getPreviousPeriod, sumSeries, averageSeries, computeDeltaPct } from "./utils";
import { visitorsSeries, activationRateSeries } from "./website";
import { clicksSeries } from "./search-console";
import { newBacklinksSeries } from "./seo";
import { keywordRankings } from "./keywords";

faker.seed(SEEDS.executiveSummary);

const RANGE = 7;

const visitorsCurrent = sumSeries(sliceLastNDays(visitorsSeries, RANGE));
const visitorsPrevious = sumSeries(getPreviousPeriod(visitorsSeries, RANGE));
export const websiteTrafficDeltaPct = computeDeltaPct(visitorsCurrent, visitorsPrevious);

const clicksCurrent = sumSeries(sliceLastNDays(clicksSeries, RANGE));
const clicksPrevious = sumSeries(getPreviousPeriod(clicksSeries, RANGE));
export const organicClicksDeltaPct = computeDeltaPct(clicksCurrent, clicksPrevious);

const activationCurrent = averageSeries(sliceLastNDays(activationRateSeries, RANGE));
const activationPrevious = averageSeries(getPreviousPeriod(activationRateSeries, RANGE));
export const activationRateDeltaPct = computeDeltaPct(activationCurrent, activationPrevious);

export const newBacklinksThisWeek = Math.round(sumSeries(sliceLastNDays(newBacklinksSeries, RANGE)));

export const breakoutKeyword =
  keywordRankings.find((k) => k.currentPosition <= 10 && k.previousPosition > 10) ??
  keywordRankings[0];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const growthScore = Math.round(
  clamp(
    62 +
      websiteTrafficDeltaPct * 0.8 +
      organicClicksDeltaPct * 0.6 +
      (newBacklinksThisWeek - 8) * 0.5,
    0,
    100
  )
);

export const healthScore = Math.round(
  clamp(70 + activationRateDeltaPct * 1.4 - Math.abs(activationRateDeltaPct < 0 ? activationRateDeltaPct : 0), 0, 100)
);

export type SummaryItem = {
  id: string;
  text: string;
};

export const wins: SummaryItem[] = [
  { id: "traffic", text: `Website traffic ${websiteTrafficDeltaPct >= 0 ? "increased" : "decreased"} ${Math.abs(websiteTrafficDeltaPct)}% this week.` },
  { id: "clicks", text: `Organic search clicks ${organicClicksDeltaPct >= 0 ? "increased" : "decreased"} ${Math.abs(organicClicksDeltaPct)}%.` },
  { id: "backlinks", text: `${newBacklinksThisWeek} new high-authority backlinks acquired.` },
  { id: "keyword", text: `Keyword "${breakoutKeyword.keyword}" entered the Top 10.` },
].filter((item) => (item.id === "traffic" ? websiteTrafficDeltaPct >= 0 : item.id === "clicks" ? organicClicksDeltaPct >= 0 : true));

export const risks: SummaryItem[] = [
  {
    id: "activation",
    text: `Activation rate ${activationRateDeltaPct >= 0 ? "increased" : "decreased"} ${Math.abs(activationRateDeltaPct)}% week-over-week.`,
  },
  { id: "competition", text: "Pinecone continues to outpace HydraDB on estimated organic traffic." },
  { id: "backlinks-lost", text: "A handful of referring domains were lost this week — worth auditing for broken backlinks." },
];

export const recommendations: SummaryItem[] = [
  { id: "rec-1", text: "Double down on GraphRAG content — it's driving the fastest keyword growth." },
  { id: "rec-2", text: "Investigate the activation funnel drop-off between signup and first query." },
  { id: "rec-3", text: "Reach out to newly acquired referring domains for co-marketing opportunities." },
];

export const aiSummary = `This week, website traffic ${websiteTrafficDeltaPct >= 0 ? "grew" : "declined"} ${Math.abs(websiteTrafficDeltaPct)}% alongside a ${Math.abs(organicClicksDeltaPct)}% ${organicClicksDeltaPct >= 0 ? "increase" : "decrease"} in organic search clicks. Activation rate moved ${activationRateDeltaPct >= 0 ? "up" : "down"} ${Math.abs(activationRateDeltaPct)}%, and the team secured ${newBacklinksThisWeek} new high-authority backlinks. The keyword "${breakoutKeyword.keyword}" broke into the Top 10, a strong signal for GraphRAG-related content investment.`;
