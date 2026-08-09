/**
 * Pacific-time day boundaries for Google Search Console.
 *
 * GSC buckets every metric by day in America/Los_Angeles, and the values of its
 * `date` dimension are already in PT. Our sync-window math — what "today" is,
 * "16 months ago", the trailing lag window — must use the SAME boundaries, or
 * near UTC midnight we ask Google for a day that doesn't exist yet in PT (or
 * miss the freshest day). All GSC date math goes through here rather than
 * `toISOString()`, which is UTC and was the latent timezone bug in the old code.
 */

const GSC_TIME_ZONE = "America/Los_Angeles";

// en-CA renders as YYYY-MM-DD — exactly the shape GSC's `date` dimension uses.
const PT_YMD = new Intl.DateTimeFormat("en-CA", {
  timeZone: GSC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar date (YYYY-MM-DD) that `instant` falls on in Pacific time. */
export function pacificDateString(instant: Date): string {
  return PT_YMD.format(instant);
}

/** Today in Pacific time — the latest day GSC could conceivably have data for. */
export function pacificToday(now: Date = new Date()): string {
  return pacificDateString(now);
}

/** Add (or subtract) whole days to a YYYY-MM-DD string via calendar math. */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Add (or subtract) whole months to a YYYY-MM-DD string. */
export function addMonths(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + months);
  return dt.toISOString().slice(0, 10);
}

/** Inclusive count of days between two YYYY-MM-DD strings. */
export function dayCountInclusive(startYmd: string, endYmd: string): number {
  const [ys, ms, ds] = startYmd.split("-").map(Number);
  const [ye, me, de] = endYmd.split("-").map(Number);
  const start = Date.UTC(ys, ms - 1, ds);
  const end = Date.UTC(ye, me - 1, de);
  return Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Parse a YYYY-MM-DD (PT calendar) date into a UTC-midnight Date for a Postgres
 * `@db.Date` column. Date-only columns ignore the time/zone, so UTC midnight
 * round-trips the calendar date losslessly.
 */
export function ymdToUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** Inverse of {@link ymdToUtcDate}: a stored `@db.Date` back to YYYY-MM-DD. */
export function utcDateToYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}
