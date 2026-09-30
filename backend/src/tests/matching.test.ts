import assert from "node:assert/strict";
import test from "node:test";
import { PoolStatus } from "@prisma/client";
import { isPoolMatchEligible } from "../services/matching.service";

const waitingBananiPool = {
  pickup: "Banani",
  destination: "Mohakhali",
  status: PoolStatus.WAITING,
  isTeslaOnline: true,
  capacity: 3,
  usedSeats: 2,
};

test("a third one-seat passenger can join a three-seat pool", () => {
  assert.equal(
    isPoolMatchEligible(waitingBananiPool, {
      pickup: "Banani",
      destination: "Gulshan",
      seats: 1,
    }),
    true,
  );
});

test("a request that exceeds remaining capacity is rejected", () => {
  assert.equal(
    isPoolMatchEligible(waitingBananiPool, {
      pickup: "Banani",
      destination: "Gulshan",
      seats: 4,
    }),
    false,
  );
});

test("a different pickup area is rejected", () => {
  assert.equal(
    isPoolMatchEligible(waitingBananiPool, {
      pickup: "Gulshan",
      destination: "Mohakhali",
      seats: 1,
    }),
    false,
  );
});

test("an offline Tesla or non-waiting pool is rejected", () => {
  assert.equal(
    isPoolMatchEligible(
      { ...waitingBananiPool, isTeslaOnline: false },
      { pickup: "Banani", destination: "Gulshan", seats: 1 },
    ),
    false,
  );
  assert.equal(
    isPoolMatchEligible(
      { ...waitingBananiPool, status: PoolStatus.ACTIVE },
      { pickup: "Banani", destination: "Gulshan", seats: 1 },
    ),
    false,
  );
});

test("destinations outside the compatibility radius are rejected", () => {
  assert.equal(
    isPoolMatchEligible(waitingBananiPool, {
      pickup: "Banani",
      destination: "Uttara",
      seats: 1,
    }),
    false,
  );
});
