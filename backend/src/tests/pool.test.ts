import assert from "node:assert/strict";
import { test } from "node:test";
import { hasPoolCapacity } from "../services/capacity.service";

test("Bullet accepts Nusrat and Rafiq but rejects Shirin's overflow", () => {
  const capacity = 3;
  let usedSeats = 0;

  assert.equal(hasPoolCapacity(capacity, usedSeats, 1), true);
  usedSeats += 1;
  assert.equal(hasPoolCapacity(capacity, usedSeats, 1), true);
  usedSeats += 1;
  assert.equal(hasPoolCapacity(capacity, usedSeats, 2), false);
});
