import assert from "node:assert/strict";
import test from "node:test";
import {
  createDefaultTeslaData,
  DEFAULT_TESLA_CAPACITY,
} from "../services/driver-onboarding.service";

test("new drivers receive an offline three-seat Tesla", () => {
  assert.deepEqual(createDefaultTeslaData("driver-id", "  Amina  "), {
    driverId: "driver-id",
    name: "Amina's Tesla",
    capacity: DEFAULT_TESLA_CAPACITY,
    isOnline: false,
    currentArea: null,
  });
  assert.equal(DEFAULT_TESLA_CAPACITY, 3);
});
