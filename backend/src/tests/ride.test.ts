import assert from "node:assert/strict";
import { test } from "node:test";
import { RideStatus } from "@prisma/client";
import { isRideOwner } from "../services/authorization.service";
import { canTransitionRide } from "../services/ride-state.service";

test("ride ownership and lifecycle rules are enforced together", () => {
  assert.equal(isRideOwner("nusrat", "rafiq"), false);
  assert.equal(
    canTransitionRide(RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED),
    true,
  );
  assert.equal(
    canTransitionRide(RideStatus.MATCHED, RideStatus.COMPLETED),
    false,
  );
});
