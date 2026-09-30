-- Preserve an auditable ride lifecycle and add database-level invariants for
-- values that can be validated without crossing table boundaries.
ALTER TABLE "User"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Ride"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "RideStatusHistory" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "status" "RideStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RideStatusHistory_rideId_createdAt_idx"
ON "RideStatusHistory"("rideId", "createdAt");

ALTER TABLE "RideStatusHistory"
ADD CONSTRAINT "RideStatusHistory_rideId_fkey"
FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PoolMember" DROP CONSTRAINT "PoolMember_poolId_fkey";
ALTER TABLE "PoolMember" DROP CONSTRAINT "PoolMember_rideId_fkey";

ALTER TABLE "PoolMember"
ADD CONSTRAINT "PoolMember_poolId_fkey"
FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PoolMember"
ADD CONSTRAINT "PoolMember_rideId_fkey"
FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tesla"
ADD CONSTRAINT "Tesla_capacity_check" CHECK ("capacity" > 0);

ALTER TABLE "Ride"
ADD CONSTRAINT "Ride_seats_check" CHECK ("seats" > 0),
ADD CONSTRAINT "Ride_fare_check" CHECK ("fare" >= 0);

ALTER TABLE "PoolMember"
ADD CONSTRAINT "PoolMember_seats_check" CHECK ("seats" > 0),
ADD CONSTRAINT "PoolMember_fare_check" CHECK ("individualFare" >= 0);
