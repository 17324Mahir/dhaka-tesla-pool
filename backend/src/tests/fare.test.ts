import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateFare } from "../services/fare.service";

test("pooled ride should apply the flat discount", () => {
  assert.equal(calculateFare(1, true), 13_000);
});

test("unpooled ride should not apply the discount", () => {
  assert.equal(calculateFare(1, false), 15_000);
});

test("fare calculation should reject invalid seat counts", () => {
  assert.throws(() => calculateFare(0, true), RangeError);
});
