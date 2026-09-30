import assert from "node:assert/strict";
import { test } from "node:test";
import { toPassengerPoolView } from "../services/pool-view.service";

test("passenger pool view contains only the requesting passenger's ride", () => {
  const pool = {
    id: "pool-1",
    status: "WAITING",
    tesla: { id: "tesla-1", name: "Bullet", capacity: 3 },
    members: [
      {
        id: "member-nusrat",
        seats: 1,
        individualFare: 13_000,
        ride: {
          id: "ride-nusrat",
          passengerId: "nusrat",
          pickup: "Banani",
          destination: "Mohakhali",
          seats: 1,
          status: "MATCHED",
          fare: 13_000,
          createdAt: new Date(),
        },
      },
      {
        id: "member-rafiq",
        seats: 1,
        individualFare: 13_000,
        ride: {
          id: "ride-rafiq",
          passengerId: "rafiq",
          pickup: "Banani",
          destination: "Gulshan",
          seats: 1,
          status: "MATCHED",
          fare: 13_000,
          createdAt: new Date(),
        },
      },
    ],
  };

  const view = toPassengerPoolView(pool, "nusrat");
  const serialized = JSON.stringify(view);

  assert.equal(view.memberCount, 2);
  assert.equal(view.myMembership?.ride.id, "ride-nusrat");
  assert.equal(serialized.includes("ride-rafiq"), false);
  assert.equal(serialized.includes("Gulshan"), false);
});
