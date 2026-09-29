import assert from "node:assert/strict";
import { test } from "node:test";
import { hasPoolCapacity } from "../services/capacity.service";

test("Tesla capacity accepts a ride that fits exactly", () => {
  assert.equal(hasPoolCapacity(3, 2, 1), true);
});

test("Tesla capacity rejects overflow", () => {
  assert.equal(hasPoolCapacity(3, 2, 2), false);
  assert.equal(hasPoolCapacity(3, 3, 1), false);
});

test("Tesla capacity rejects invalid seat counts", () => {
  assert.throws(() => hasPoolCapacity(3, 0, 0), RangeError);
  assert.throws(() => hasPoolCapacity(3, -1, 1), RangeError);
});
