import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma } from "@prisma/client";
import { withPoolMatchRetries } from "../services/pool.service";

test("pool matching retries serialization conflicts before returning", async () => {
  let attempts = 0;

  const result = await withPoolMatchRetries(async () => {
    attempts += 1;

    if (attempts < 3) {
      throw new Prisma.PrismaClientKnownRequestError(
        "Concurrent write conflict",
        { code: "P2034", clientVersion: "test" },
      );
    }

    return "capacity rechecked";
  });

  assert.equal(result, "capacity rechecked");
  assert.equal(attempts, 3);
});
