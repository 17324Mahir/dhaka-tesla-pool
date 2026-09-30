-- Tips are stored in integer paisa and belong to one passenger ride, keeping
-- pooled fares and gratuities isolated per passenger.
ALTER TABLE "Ride"
ADD COLUMN "tip" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tipUpdatedAt" TIMESTAMP(3);

ALTER TABLE "Ride"
ADD CONSTRAINT "Ride_tip_check" CHECK ("tip" >= 0);
