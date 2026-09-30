import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateFare,
  calculateReceipt,
  calculateSharedFares,
} from "../services/fare.service";

test("fare uses each passenger's route distance", () => {
  assert.equal(calculateFare("Banani", "Mohakhali", false), 5_192);
  assert.equal(calculateFare("Banani", "Gulshan 1", false), 5_095);
});

test("pool discount applies only when at least two passengers share", () => {
  const nusrat = { pickup: "Banani", destination: "Mohakhali" };
  const rafiq = { pickup: "Banani", destination: "Gulshan 1" };

  assert.deepEqual(calculateSharedFares([nusrat]), [5_192]);
  assert.deepEqual(calculateSharedFares([nusrat, rafiq]), [4_154, 4_076]);
  assert.deepEqual(calculateSharedFares([nusrat]), [5_192]);
});

test("fare calculation rejects unsupported or identical areas", () => {
  assert.throws(() => calculateFare("Banani", "Banani", false), RangeError);
  assert.throws(() => calculateFare("Banani", "Unknown", false), RangeError);
});

test("receipt keeps fare and tip separate and calculates the total", () => {
  assert.deepEqual(calculateReceipt(4_154, 2_000), {
    fare: 4_154,
    tip: 2_000,
    total: 6_154,
  });
  assert.throws(() => calculateReceipt(4_154, -1), RangeError);
});
