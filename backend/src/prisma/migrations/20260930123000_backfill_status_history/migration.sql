-- Existing rides predate the lifecycle audit table. Record their current
-- state once so every ride has at least one history entry after deployment.
INSERT INTO "RideStatusHistory" ("id", "rideId", "status", "createdAt")
SELECT
  'backfill-' || md5(ride."id"),
  ride."id",
  ride."status",
  ride."createdAt"
FROM "Ride" AS ride
WHERE NOT EXISTS (
  SELECT 1
  FROM "RideStatusHistory" AS history
  WHERE history."rideId" = ride."id"
);
