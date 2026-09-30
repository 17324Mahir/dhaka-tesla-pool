import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateFare, calculateReceipt } from "../services/fare.service";

test("pooled ride should apply the flat discount", () => {
  assert.equal(calculateFare(1, true), 13_000);
});

test("unpooled ride should not apply the discount", () => {
  assert.equal(calculateFare(1, false), 15_000);
});

test("fare calculation should reject invalid seat counts", () => {
  assert.throws(() => calculateFare(0, true), RangeError);
});

test("receipt keeps fare and tip separate and calculates the total", () => {
  assert.deepEqual(calculateReceipt(13_000, 2_000), {
    fare: 13_000,
    tip: 2_000,
    total: 15_000,
  });
  assert.throws(() => calculateReceipt(13_000, -1), RangeError);
});
