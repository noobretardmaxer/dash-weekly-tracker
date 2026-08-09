import assert from "node:assert/strict";
import { test } from "node:test";
import { bucketKey } from "./read";

test("daily bucketing is the identity", () => {
  assert.equal(bucketKey("2026-08-09", "daily"), "2026-08-09");
});

test("monthly bucketing collapses to the first of the month", () => {
  assert.equal(bucketKey("2026-08-09", "monthly"), "2026-08-01");
  assert.equal(bucketKey("2026-08-31", "monthly"), "2026-08-01");
});

test("weekly bucketing snaps to the Monday of that ISO week", () => {
  // 2026-08-09 is a Sunday → its ISO week starts Monday 2026-08-03.
  assert.equal(bucketKey("2026-08-09", "weekly"), "2026-08-03");
  // 2026-08-03 is that Monday → maps to itself.
  assert.equal(bucketKey("2026-08-03", "weekly"), "2026-08-03");
  // 2026-08-10 is the next Monday → next week.
  assert.equal(bucketKey("2026-08-10", "weekly"), "2026-08-10");
});
