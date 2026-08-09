/**
 * Range aggregation for Search Console metrics — the single most common way
 * these dashboards drift from Google's UI is by averaging an average. This
 * module is the one place range rollups happen, and it does it GSC's way:
 *
 *   range clicks      = Σ clicks
 *   range impressions = Σ impressions
 *   range CTR         = Σ clicks / Σ impressions            (NOT mean of daily CTRs)
 *   range position    = Σ (position · impressions) / Σ impressions  (impression-weighted)
 *
 * ctr is kept as a fraction (0..1), matching how it is stored and how GSC
 * returns it; the API/UI layer formats it as a percentage.
 */

export interface Metricish {
  clicks: number;
  impressions: number;
  /** stored fraction 0..1 (unused by the rollup, kept for shape symmetry) */
  ctr: number;
  position: number;
}

export interface RangeAggregate {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** Roll up daily rows over a date range the GSC way (see module docs). */
export function aggregateRange(rows: Metricish[]): RangeAggregate {
  let clicks = 0;
  let impressions = 0;
  let weightedPosition = 0;
  for (const row of rows) {
    clicks += row.clicks;
    impressions += row.impressions;
    weightedPosition += row.position * row.impressions;
  }
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? weightedPosition / impressions : 0,
  };
}

/**
 * Group rows by a key (query / page / country / …) and aggregate each group
 * over the range. Used by the dimension read endpoints to turn per-day rows
 * into the "top N over the whole range" tables GSC shows.
 */
export function aggregateByKey<T extends Metricish>(rows: (T & { key: string })[]): (RangeAggregate & { key: string })[] {
  const groups = new Map<string, Metricish[]>();
  for (const row of rows) {
    const bucket = groups.get(row.key);
    if (bucket) bucket.push(row);
    else groups.set(row.key, [row]);
  }
  return Array.from(groups, ([key, groupRows]) => ({ key, ...aggregateRange(groupRows) }));
}
