import assert from "node:assert/strict";
import { test } from "node:test";
import { isRideOwner } from "../services/authorization.service";

test("a passenger can modify their own ride", () => {
  assert.equal(isRideOwner("user-a", "user-a"), true);
});

test("a passenger cannot modify another passenger's ride", () => {
  assert.equal(isRideOwner("user-a", "user-b"), false);
});
