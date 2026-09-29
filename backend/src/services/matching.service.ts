import { PoolStatus } from "@prisma/client";
import { hasPoolCapacity } from "./capacity.service";

interface PoolCandidate {
  pickup: string;
  status: PoolStatus;
  isTeslaOnline: boolean;
  capacity: number;
  usedSeats: number;
}

interface RideRequest {
  pickup: string;
  seats: number;
}

export function isPoolMatchEligible(
  pool: PoolCandidate,
  ride: RideRequest,
): boolean {
  return (
    pool.pickup === ride.pickup &&
    pool.status === PoolStatus.WAITING &&
    pool.isTeslaOnline &&
    hasPoolCapacity(pool.capacity, pool.usedSeats, ride.seats)
  );
}
