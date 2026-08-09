import assert from "node:assert/strict";
import { test } from "node:test";
import { aggregateByKey, aggregateRange } from "./aggregate";

test("range CTR is Σclicks/Σimpressions, NOT the mean of daily CTRs", () => {
  const rows = [
    { clicks: 100, impressions: 1000, ctr: 0.1, position: 5 }, // daily CTR 10%
    { clicks: 50, impressions: 200, ctr: 0.25, position: 15 }, // daily CTR 25%
  ];
  const agg = aggregateRange(rows);
  assert.equal(agg.clicks, 150);
  assert.equal(agg.impressions, 1200);
  // Correct: 150/1200 = 0.125. The naive mean of daily CTRs would be 0.175 — wrong.
  assert.equal(agg.ctr, 0.125);
  assert.notEqual(agg.ctr, (0.1 + 0.25) / 2);
});

test("range position is impression-weighted, NOT a plain average", () => {
  const rows = [
    { clicks: 0, impressions: 1000, ctr: 0, position: 5 },
    { clicks: 0, impressions: 200, ctr: 0, position: 15 },
  ];
  const agg = aggregateRange(rows);
  // Correct: (5*1000 + 15*200) / 1200 = 8000/1200 = 6.667. Plain average would be 10.
  assert.ok(Math.abs(agg.position - 8000 / 1200) < 1e-9);
  assert.notEqual(agg.position, (5 + 15) / 2);
});

test("reproduces the Section-8 headline totals (3.65k / 21.9k / 16.7% / 9.2)", () => {
  // The acceptance fixture, as a single settled bucket. End-to-end validation
  // against live data happens in Phase 8; this pins the math to the target.
  const agg = aggregateRange([{ clicks: 3648, impressions: 21900, ctr: 0, position: 9.2 }]);
  assert.equal(agg.clicks, 3648);
  assert.equal(agg.impressions, 21900);
  assert.ok(Math.abs(agg.ctr - 0.167) < 0.001, `ctr ${agg.ctr} should round to 16.7%`);
  assert.equal(agg.position, 9.2);
});

test("empty / zero-impression input never divides by zero", () => {
  assert.deepEqual(aggregateRange([]), { clicks: 0, impressions: 0, ctr: 0, position: 0 });
  assert.deepEqual(aggregateRange([{ clicks: 0, impressions: 0, ctr: 0, position: 0 }]), {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
  });
});

test("aggregateByKey rolls up each key independently over the range", () => {
  const rows = [
    { key: "hydradb", clicks: 2000, impressions: 3000, ctr: 0, position: 1.2 },
    { key: "hydradb", clicks: 413, impressions: 1347, ctr: 0, position: 1.5 },
    { key: "hydra db", clicks: 716, impressions: 1693, ctr: 0, position: 2.1 },
  ];
  const out = aggregateByKey(rows).sort((a, b) => b.clicks - a.clicks);
  assert.equal(out.length, 2);
  assert.equal(out[0].key, "hydradb");
  assert.equal(out[0].clicks, 2413);
  assert.equal(out[0].impressions, 4347);
  assert.equal(out[1].key, "hydra db");
  assert.equal(out[1].clicks, 716);
});
