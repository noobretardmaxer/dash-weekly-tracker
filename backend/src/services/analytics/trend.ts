import type { TimeSeriesPoint } from "./growth";

export type Trend = { direction: "up" | "down" | "flat"; slope: number; confidence: number };

/** Simple ordinary-least-squares slope over the series, used as a lightweight trend detector. */
export function detectTrend(series: TimeSeriesPoint[]): Trend {
  const n = series.length;
  if (n < 2) return { direction: "flat", slope: 0, confidence: 0 };

  const xs = series.map((_, i) => i);
  const ys = series.map((p) => p.value);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    numerator += (xs[i] - xMean) * (ys[i] - yMean);
    denominator += (xs[i] - xMean) ** 2;
  }
  const slope = denominator === 0 ? 0 : numerator / denominator;

  const ssTot = ys.reduce((acc, y) => acc + (y - yMean) ** 2, 0);
  const ssRes = ys.reduce((acc, y, i) => acc + (y - (yMean + slope * (xs[i] - xMean))) ** 2, 0);
  const rSquared = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  const relativeSlope = yMean === 0 ? 0 : (slope * n) / yMean;
  const direction = relativeSlope > 0.02 ? "up" : relativeSlope < -0.02 ? "down" : "flat";

  return { direction, slope, confidence: Number(rSquared.toFixed(2)) };
}
