import assert from "node:assert/strict";
import test from "node:test";
import {
  createRideBodySchema,
  driverStatusBodySchema,
  loginBodySchema,
  registerBodySchema,
  rideTipBodySchema,
} from "../validation/request.schemas";

test("registration normalizes email and rejects unknown fields", () => {
  const valid = registerBodySchema.parse({
    name: "Nusrat",
    email: "  PASSENGER@TEST.COM ",
    password: "password123",
    role: "PASSENGER",
  });

  assert.equal(valid.email, "passenger@test.com");
  assert.equal(
    registerBodySchema.safeParse({ ...valid, admin: true }).success,
    false,
  );
});

test("tip validation accepts integer paisa and rejects negative values", () => {
  assert.deepEqual(rideTipBodySchema.parse({ tip: 2_000 }), { tip: 2_000 });
  assert.equal(rideTipBodySchema.safeParse({ tip: -1 }).success, false);
  assert.equal(rideTipBodySchema.safeParse({ tip: 12.5 }).success, false);
});

test("login rejects malformed email addresses", () => {
  assert.equal(
    loginBodySchema.safeParse({ email: "not-an-email", password: "secret" })
      .success,
    false,
  );
});

test("ride validation canonicalizes areas and enforces Tesla capacity", () => {
  const valid = createRideBodySchema.parse({
    pickup: "banani",
    destination: "mohakhali",
    seats: 1,
  });

  assert.equal(valid.pickup, "Banani");
  assert.equal(valid.destination, "Mohakhali");
  assert.equal(
    createRideBodySchema.safeParse({
      pickup: "Banani",
      destination: "Mohakhali",
      seats: 4,
    }).success,
    false,
  );
});

test("drivers must choose a supported current area when going online", () => {
  assert.deepEqual(
    driverStatusBodySchema.parse({ isOnline: true, currentArea: "banani" }),
    { isOnline: true, currentArea: "Banani" },
  );
  assert.equal(
    driverStatusBodySchema.safeParse({ isOnline: true }).success,
    false,
  );
  assert.equal(
    driverStatusBodySchema.safeParse({
      isOnline: true,
      currentArea: "Chattogram",
    }).success,
    false,
  );
  assert.deepEqual(driverStatusBodySchema.parse({ isOnline: false }), {
    isOnline: false,
  });
});
