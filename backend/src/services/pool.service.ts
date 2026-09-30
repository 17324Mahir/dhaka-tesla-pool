import { PoolStatus, Prisma, RideStatus } from "@prisma/client";
import prisma from "../prisma/client";
import { calculateFare } from "./fare.service";
import { isPoolMatchEligible } from "./matching.service";
import { canTransitionRide } from "./ride-state.service";

const MAX_TRANSACTION_ATTEMPTS = 3;

export function shouldRetryPoolMatch(error: unknown, attempt: number): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034" &&
    attempt < MAX_TRANSACTION_ATTEMPTS
  );
}

export async function withPoolMatchRetries<T>(
  operation: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!shouldRetryPoolMatch(error, attempt)) {
        throw error;
      }
    }
  }

  throw new PoolMatchError("Pool matching failed");
}

export class PoolMatchError extends Error {}

export class NoTeslaAvailableError extends PoolMatchError {
  constructor() {
    super("No Tesla available");
  }
}

async function matchInTransaction(rideId: string) {
  return prisma.$transaction(
    async (tx) => {
      const ride = await tx.ride.findUnique({
        where: { id: rideId },
        include: { poolMember: true },
      });

      if (!ride) {
        throw new PoolMatchError("Ride not found");
      }

      if (ride.poolMember) {
        return tx.pool.findUniqueOrThrow({
          where: { id: ride.poolMember.poolId },
          include: {
            tesla: true,
            members: { include: { ride: true } },
          },
        });
      }

      if (!canTransitionRide(ride.status, RideStatus.MATCHED)) {
        throw new PoolMatchError("Ride is not available for matching");
      }

      const candidatePools = await tx.pool.findMany({
        where: {
          status: PoolStatus.WAITING,
          tesla: {
            isOnline: true,
            capacity: { gte: ride.seats },
          },
          members: {
            some: {
              ride: {
                pickup: ride.pickup,
                status: RideStatus.MATCHED,
              },
            },
          },
        },
        include: {
          tesla: true,
          members: {
            where: {
              ride: {
                status: {
                  notIn: [RideStatus.COMPLETED, RideStatus.CANCELLED],
                },
              },
            },
            select: {
              seats: true,
              ride: { select: { pickup: true, destination: true } },
            },
          },
        },
        orderBy: { id: "asc" },
      });

      let selectedPool = candidatePools.find((pool) => {
        const usedSeats = pool.members.reduce(
          (total, member) => total + member.seats,
          0,
        );

        const pickup = pool.members[0]?.ride.pickup;
        const destination = pool.members[0]?.ride.destination;

        return Boolean(
          pickup && destination &&
            isPoolMatchEligible(
              {
                pickup,
                destination,
                status: pool.status,
                isTeslaOnline: pool.tesla.isOnline,
                capacity: pool.tesla.capacity,
                usedSeats,
              },
              {
                pickup: ride.pickup,
                destination: ride.destination,
                seats: ride.seats,
              },
            ),
        );
      });

      if (!selectedPool) {
        const tesla = await tx.tesla.findFirst({
          where: {
            isOnline: true,
            capacity: { gte: ride.seats },
            pools: {
              none: {
                status: { in: [PoolStatus.WAITING, PoolStatus.ACTIVE] },
              },
            },
          },
          orderBy: { id: "asc" },
        });

        if (!tesla) {
          throw new NoTeslaAvailableError();
        }

        const newPool = await tx.pool.create({
          data: {
            teslaId: tesla.id,
            status: PoolStatus.WAITING,
          },
          include: {
            tesla: true,
            members: {
              select: {
                seats: true,
                ride: { select: { pickup: true, destination: true } },
              },
            },
          },
        });

        selectedPool = newPool;
      }

      const pooledFare = calculateFare(ride.seats, true);

      await tx.poolMember.create({
        data: {
          poolId: selectedPool.id,
          rideId: ride.id,
          seats: ride.seats,
          individualFare: pooledFare,
        },
      });

      await tx.ride.update({
        where: { id: ride.id },
        data: {
          status: RideStatus.MATCHED,
          fare: pooledFare,
          statusHistory: { create: { status: RideStatus.MATCHED } },
        },
      });

      return tx.pool.findUniqueOrThrow({
        where: { id: selectedPool.id },
        include: {
          tesla: true,
          members: { include: { ride: true } },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function matchRideToPool(rideId: string) {
  return withPoolMatchRetries(() => matchInTransaction(rideId));
}
