import assert from "node:assert/strict";
import { test } from "node:test";
import { RideStatus } from "@prisma/client";
import { canTransitionRide } from "../services/ride-state.service";

test("the valid ride lifecycle is allowed", () => {
  assert.equal(
    canTransitionRide(RideStatus.REQUESTED, RideStatus.MATCHED),
    true,
  );
  assert.equal(
    canTransitionRide(RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED),
    true,
  );
  assert.equal(
    canTransitionRide(RideStatus.DRIVER_ARRIVED, RideStatus.STARTED),
    true,
  );
  assert.equal(
    canTransitionRide(RideStatus.STARTED, RideStatus.COMPLETED),
    true,
  );
});

test("a completed ride cannot be started or cancelled", () => {
  assert.equal(
    canTransitionRide(RideStatus.COMPLETED, RideStatus.STARTED),
    false,
  );
  assert.equal(
    canTransitionRide(RideStatus.COMPLETED, RideStatus.CANCELLED),
    false,
  );
});

test("only requested or matched rides can be cancelled", () => {
  assert.equal(
    canTransitionRide(RideStatus.REQUESTED, RideStatus.CANCELLED),
    true,
  );
  assert.equal(
    canTransitionRide(RideStatus.MATCHED, RideStatus.CANCELLED),
    true,
  );
  assert.equal(
    canTransitionRide(RideStatus.DRIVER_ARRIVED, RideStatus.CANCELLED),
    false,
  );
});
