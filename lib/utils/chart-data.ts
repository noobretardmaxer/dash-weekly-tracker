import type { TimeSeriesPoint } from "@/lib/mock-data/types";

export type ComparePoint = {
  date: string;
  current: number;
  previous: number | undefined;
};

/** Aligns a "current period" series with a "previous period" series by relative day offset (not by date). */
export function mergeCompareSeries(
  current: TimeSeriesPoint[],
  previous: TimeSeriesPoint[]
): ComparePoint[] {
  return current.map((point, i) => ({
    date: point.date,
    current: point.value,
    previous: previous[i]?.value,
  }));
}
