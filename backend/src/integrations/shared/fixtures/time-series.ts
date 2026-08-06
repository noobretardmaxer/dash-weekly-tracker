import { faker } from "@faker-js/faker";

/**
 * Ported from lib/mock-data/utils.ts / seed.ts (frontend mock data) so that
 * MOCK_MODE output looks the same as the dashboard's original static demo data.
 */
export const MASTER_SERIES_DAYS = 200;

export type TimeSeriesPoint = { date: string; value: number };

export type GenerateTimeSeriesOptions = {
  days?: number;
  baseValue: number;
  volatility?: number;
  trendPct?: number;
  minValue?: number;
  round?: boolean;
  weekendFactor?: number;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildDateSpine(count: number, endDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

export function generateTimeSeries({
  days = MASTER_SERIES_DAYS,
  baseValue,
  volatility = 0.12,
  trendPct = 10,
  minValue = 0,
  round = true,
  weekendFactor = 1,
}: GenerateTimeSeriesOptions): TimeSeriesPoint[] {
  const dates = buildDateSpine(days);
  const trendMultiplierEnd = 1 + trendPct / 100;

  return dates.map((date, i) => {
    const progress = days <= 1 ? 1 : i / (days - 1);
    const trendValue = baseValue * (1 + (trendMultiplierEnd - 1) * progress);
    const noise = 1 + faker.number.float({ min: -volatility, max: volatility, fractionDigits: 3 });
    const dow = date.getDay();
    const weekendMultiplier = dow === 0 || dow === 6 ? weekendFactor : 1;
    const value = Math.max(minValue, trendValue * noise * weekendMultiplier);
    return { date: toIsoDate(date), value: round ? Math.round(value) : Number(value.toFixed(2)) };
  });
}

export const FIXTURE_SEEDS = {
  posthog: 1001,
  gsc: 1003,
  semrush: 1002,
  twitter: 1005,
  discord: 1006,
  reddit: 1007,
  keywords: 1008,
  content: 1004,
  social: 1009,
} as const;
