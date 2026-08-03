import type { TimeSeriesPoint } from "./growth";

export type Anomaly = { date: string; value: number; zScore: number; severity: "warning" | "critical" };

/** Z-score based anomaly detection: flags points more than 2.5 (warning) or 3.5 (critical) std-devs from the mean. */
export function detectAnomalies(series: TimeSeriesPoint[]): Anomaly[] {
  if (series.length < 3) return [];

  const values = series.map((p) => p.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return [];

  const anomalies: Anomaly[] = [];
  for (const point of series) {
    const zScore = (point.value - mean) / stdDev;
    const absZ = Math.abs(zScore);
    if (absZ >= 3.5) {
      anomalies.push({ date: point.date, value: point.value, zScore: Number(zScore.toFixed(2)), severity: "critical" });
    } else if (absZ >= 2.5) {
      anomalies.push({ date: point.date, value: point.value, zScore: Number(zScore.toFixed(2)), severity: "warning" });
    }
  }
  return anomalies;
}
