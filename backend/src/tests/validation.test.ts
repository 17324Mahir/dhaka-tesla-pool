import assert from "node:assert/strict";
import test from "node:test";
import {
  createRideBodySchema,
  loginBodySchema,
  registerBodySchema,
} from "../validation/request.schemas";

test("registration normalizes email and rejects unknown fields", () => {
  const valid = registerBodySchema.parse({
    name: "Nusrat",
    email: "  NUSRAT@TEST.COM ",
    password: "password123",
    role: "PASSENGER",
  });

  assert.equal(valid.email, "nusrat@test.com");
  assert.equal(
    registerBodySchema.safeParse({ ...valid, admin: true }).success,
    false,
  );
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
