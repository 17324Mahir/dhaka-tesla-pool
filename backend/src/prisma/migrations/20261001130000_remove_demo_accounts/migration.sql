-- Remove only the original seeded identities. Preserve rides belonging to real
-- passengers even if they were previously assigned to the seeded driver.
UPDATE "Ride" AS ride
SET
  "status" = 'REQUESTED',
  "fare" = 15000,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE ride."status" NOT IN ('COMPLETED', 'CANCELLED')
  AND ride."passengerId" NOT IN (
    SELECT "id"
    FROM "User"
    WHERE "email" IN (
      'nusrat@test.com',
      'rafiq@test.com',
      'shirin@test.com'
    )
  )
  AND EXISTS (
    SELECT 1
    FROM "PoolMember" AS member
    JOIN "Pool" AS pool ON pool."id" = member."poolId"
    JOIN "Tesla" AS tesla ON tesla."id" = pool."teslaId"
    JOIN "User" AS driver ON driver."id" = tesla."driverId"
    WHERE member."rideId" = ride."id"
      AND driver."email" = 'jashim@test.com'
  );

DELETE FROM "Pool"
WHERE "teslaId" IN (
  SELECT tesla."id"
  FROM "Tesla" AS tesla
  JOIN "User" AS driver ON driver."id" = tesla."driverId"
  WHERE driver."email" = 'jashim@test.com'
);

DELETE FROM "Ride"
WHERE "passengerId" IN (
  SELECT "id"
  FROM "User"
  WHERE "email" IN (
    'nusrat@test.com',
    'rafiq@test.com',
    'shirin@test.com'
  )
);

UPDATE "Pool" AS pool
SET "status" = 'CANCELLED'
WHERE pool."status" IN ('WAITING', 'ACTIVE')
  AND NOT EXISTS (
    SELECT 1
    FROM "PoolMember" AS member
    WHERE member."poolId" = pool."id"
  );

DELETE FROM "Tesla"
WHERE "driverId" IN (
  SELECT "id"
  FROM "User"
  WHERE "email" = 'jashim@test.com'
);

DELETE FROM "User"
WHERE "email" IN (
  'jashim@test.com',
  'nusrat@test.com',
  'rafiq@test.com',
  'shirin@test.com'
);
