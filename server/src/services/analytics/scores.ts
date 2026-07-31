function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type GrowthScoreInputs = {
  websiteTrafficDeltaPct: number;
  organicClicksDeltaPct: number;
  newBacklinksThisWeek: number;
};

/** Generalizes the clamp-based weighted formula from lib/mock-data/executive-summary.ts so the number
 * the frontend sees hourly matches the number baked into the weekly executive report. */
export function growthScore(inputs: GrowthScoreInputs): number {
  return Math.round(
    clamp(
      62 +
        inputs.websiteTrafficDeltaPct * 0.8 +
        inputs.organicClicksDeltaPct * 0.6 +
        (inputs.newBacklinksThisWeek - 8) * 0.5,
      0,
      100
    )
  );
}

export type HealthScoreInputs = {
  activationRateDeltaPct: number;
};

export function healthScore(inputs: HealthScoreInputs): number {
  const { activationRateDeltaPct } = inputs;
  return Math.round(
    clamp(70 + activationRateDeltaPct * 1.4 - Math.abs(activationRateDeltaPct < 0 ? activationRateDeltaPct : 0), 0, 100)
  );
}
