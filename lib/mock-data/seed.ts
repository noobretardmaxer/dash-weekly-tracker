export const SEEDS = {
  website: 1001,
  seo: 1002,
  searchConsole: 1003,
  content: 1004,
  twitter: 1005,
  discord: 1006,
  reddit: 1007,
  keywords: 1008,
  executiveSummary: 1009,
} as const;

/**
 * Length of the master daily series every metric generates before slicing to a range.
 * Must be at least 2x the largest range preset (90 days) so "compare previous period"
 * always has a full equal-length window to slice, even at the 90-day view.
 */
export const MASTER_SERIES_DAYS = 200;
