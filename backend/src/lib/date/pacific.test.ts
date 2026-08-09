import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, addMonths, dayCountInclusive, pacificDateString, utcDateToYmd, ymdToUtcDate } from "./pacific";

test("pacificDateString buckets a 23:30 PT click into that PT day, not the UTC day", () => {
  // 2026-08-08 23:30 PDT === 2026-08-09 06:30 UTC. UTC day is the 9th; PT day is the 8th.
  const instant = new Date("2026-08-09T06:30:00.000Z");
  assert.equal(pacificDateString(instant), "2026-08-08");
});

test("pacificDateString handles the PST (winter) offset too", () => {
  // 2026-01-15 23:30 PST === 2026-01-16 07:30 UTC.
  assert.equal(pacificDateString(new Date("2026-01-16T07:30:00.000Z")), "2026-01-15");
});

test("pacificDateString agrees with UTC when it's clearly the same PT day", () => {
  // Noon UTC on the 9th is 05:00 PT on the 9th — same day.
  assert.equal(pacificDateString(new Date("2026-08-09T12:00:00.000Z")), "2026-08-09");
});

test("addDays / addMonths do calendar math", () => {
  assert.equal(addDays("2026-08-09", -5), "2026-08-04");
  assert.equal(addDays("2026-08-09", 5), "2026-08-14");
  assert.equal(addMonths("2026-08-09", -16), "2025-04-09");
});

test("dayCountInclusive counts both endpoints", () => {
  assert.equal(dayCountInclusive("2026-08-04", "2026-08-09"), 6);
  assert.equal(dayCountInclusive("2026-08-09", "2026-08-09"), 1);
});

test("ymd <-> UTC date round-trips the calendar date", () => {
  assert.equal(utcDateToYmd(ymdToUtcDate("2026-08-09")), "2026-08-09");
});
