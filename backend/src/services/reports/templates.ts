export type SummaryItem = { id: string; text: string };

export function buildWins(inputs: {
  websiteTrafficDeltaPct: number;
  organicClicksDeltaPct: number;
  newBacklinksThisWeek: number;
  breakoutKeyword?: string;
}): SummaryItem[] {
  const items: SummaryItem[] = [];
  if (inputs.websiteTrafficDeltaPct >= 0) {
    items.push({ id: "traffic", text: `Website traffic increased ${inputs.websiteTrafficDeltaPct}% this week.` });
  }
  if (inputs.organicClicksDeltaPct >= 0) {
    items.push({ id: "clicks", text: `Organic search clicks increased ${inputs.organicClicksDeltaPct}%.` });
  }
  items.push({ id: "backlinks", text: `${inputs.newBacklinksThisWeek} new high-authority backlinks acquired.` });
  if (inputs.breakoutKeyword) {
    items.push({ id: "keyword", text: `Keyword "${inputs.breakoutKeyword}" entered the Top 10.` });
  }
  return items;
}

export function buildRisks(inputs: {
  activationRateDeltaPct: number;
  lostBacklinksThisWeek: number;
  worstCompetitorNote?: string;
}): SummaryItem[] {
  const items: SummaryItem[] = [
    {
      id: "activation",
      text: `Activation rate ${inputs.activationRateDeltaPct >= 0 ? "increased" : "decreased"} ${Math.abs(inputs.activationRateDeltaPct)}% week-over-week.`,
    },
  ];
  if (inputs.lostBacklinksThisWeek > 0) {
    items.push({
      id: "backlinks-lost",
      text: `${inputs.lostBacklinksThisWeek} referring domains were lost this week — worth auditing for broken backlinks.`,
    });
  }
  if (inputs.worstCompetitorNote) {
    items.push({ id: "competition", text: inputs.worstCompetitorNote });
  }
  return items;
}

export function buildRecommendations(): SummaryItem[] {
  return [
    { id: "rec-1", text: "Double down on content driving the fastest keyword growth this week." },
    { id: "rec-2", text: "Investigate the activation funnel drop-off between signup and first query." },
    { id: "rec-3", text: "Reach out to newly acquired referring domains for co-marketing opportunities." },
  ];
}

export function buildAiSummary(inputs: {
  websiteTrafficDeltaPct: number;
  organicClicksDeltaPct: number;
  activationRateDeltaPct: number;
  newBacklinksThisWeek: number;
  breakoutKeyword?: string;
}): string {
  const trafficWord = inputs.websiteTrafficDeltaPct >= 0 ? "grew" : "declined";
  const clicksWord = inputs.organicClicksDeltaPct >= 0 ? "increase" : "decrease";
  const activationWord = inputs.activationRateDeltaPct >= 0 ? "up" : "down";
  const keywordSentence = inputs.breakoutKeyword
    ? ` The keyword "${inputs.breakoutKeyword}" broke into the Top 10, a strong signal for continued content investment.`
    : "";

  return (
    `This week, website traffic ${trafficWord} ${Math.abs(inputs.websiteTrafficDeltaPct)}% alongside a ` +
    `${Math.abs(inputs.organicClicksDeltaPct)}% ${clicksWord} in organic search clicks. Activation rate moved ` +
    `${activationWord} ${Math.abs(inputs.activationRateDeltaPct)}%, and the team secured ${inputs.newBacklinksThisWeek} ` +
    `new high-authority backlinks.${keywordSentence}`
  );
}
