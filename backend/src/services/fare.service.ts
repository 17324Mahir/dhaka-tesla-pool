import { Prisma, RideStatus } from "@prisma/client";
import { destinationDistanceKm } from "./matching.service";

export const BASE_FARE_PAISA = 2_500;
export const RATE_PER_KM_PAISA = 1_500;
export const POOL_DISCOUNT_PERCENT = 20;

interface FareRoute {
  pickup: string;
  destination: string;
}

export function calculateFare(
  pickup: string,
  destination: string,
  isPooled: boolean,
): number {
  const distanceKm = destinationDistanceKm(pickup, destination);

  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    throw new RangeError("Pickup and destination must be supported, different areas");
  }

  const subtotal = BASE_FARE_PAISA + Math.round(distanceKm * RATE_PER_KM_PAISA);

  return isPooled
    ? Math.round(subtotal * (1 - POOL_DISCOUNT_PERCENT / 100))
    : subtotal;
}

export function calculateSharedFares(routes: FareRoute[]): number[] {
  const isPooled = routes.length >= 2;

  return routes.map((route) =>
    calculateFare(route.pickup, route.destination, isPooled),
  );
}

export async function recalculatePoolFares(
  transaction: Prisma.TransactionClient,
  poolId: string,
): Promise<void> {
  const members = await transaction.poolMember.findMany({
    where: {
      poolId,
      ride: { status: { not: RideStatus.CANCELLED } },
    },
    include: {
      ride: {
        select: { id: true, pickup: true, destination: true },
      },
    },
    orderBy: { id: "asc" },
  });
  const fares = calculateSharedFares(
    members.map((member) => ({
      pickup: member.ride.pickup,
      destination: member.ride.destination,
    })),
  );

  for (const [index, member] of members.entries()) {
    const fare = fares[index];

    await transaction.poolMember.update({
      where: { id: member.id },
      data: { individualFare: fare },
    });
    await transaction.ride.update({
      where: { id: member.ride.id },
      data: { fare },
    });
  }
}

export function calculateReceipt(fare: number, tip: number) {
  if (
    !Number.isInteger(fare) ||
    !Number.isInteger(tip) ||
    fare < 0 ||
    tip < 0
  ) {
    throw new RangeError("Fare and tip must be non-negative integer paisa");
  }

  return { fare, tip, total: fare + tip };
}
