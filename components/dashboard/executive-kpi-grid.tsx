"use client";

import { KpiCard } from "@/components/primitives/kpi-card";
import { buildKpiMetric } from "@/lib/mock-data/utils";
import { useDateRange } from "@/lib/hooks/use-date-range";
import { visitorsSeries, uniqueVisitorsSeries, signupsSeries, activationRateSeries } from "@/lib/mock-data/website";
import { clicksSeries, avgPositionSeries } from "@/lib/mock-data/search-console";
import { followersSeries } from "@/lib/mock-data/twitter";
import { membersSeries } from "@/lib/mock-data/discord";
import { mentionsSeries as redditMentionsSeries } from "@/lib/mock-data/reddit";
import { backlinksSeries, referringDomainsSeries } from "@/lib/mock-data/seo";
import { topRankingKeywordsSeries } from "@/lib/mock-data/keywords";

export function ExecutiveKpiGrid() {
  const { days } = useDateRange();

  const metrics = [
    buildKpiMetric({ id: "visitors", label: "Website Visitors", format: "compact", fullSeries: visitorsSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "unique-visitors", label: "Unique Visitors", format: "compact", fullSeries: uniqueVisitorsSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "signups", label: "Sign-ups", format: "number", fullSeries: signupsSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "activation-rate", label: "Activation Rate", format: "percent", fullSeries: activationRateSeries, rangeDays: days, aggregate: "average" }),
    buildKpiMetric({ id: "organic-clicks", label: "Organic Search Clicks", format: "compact", fullSeries: clicksSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "avg-position", label: "Average Position", format: "position", fullSeries: avgPositionSeries, rangeDays: days, aggregate: "average", positiveIsGood: false }),
    buildKpiMetric({ id: "twitter-followers", label: "Twitter Followers", format: "compact", fullSeries: followersSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "discord-members", label: "Discord Members", format: "compact", fullSeries: membersSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "reddit-mentions", label: "Organic Reddit Mentions", format: "number", fullSeries: redditMentionsSeries, rangeDays: days, aggregate: "sum" }),
    buildKpiMetric({ id: "backlinks", label: "Backlinks", format: "compact", fullSeries: backlinksSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "referring-domains", label: "Referring Domains", format: "compact", fullSeries: referringDomainsSeries, rangeDays: days, aggregate: "last" }),
    buildKpiMetric({ id: "top-keywords", label: "Top Ranking Keywords", format: "number", fullSeries: topRankingKeywordsSeries, rangeDays: days, aggregate: "last" }),
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <KpiCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
