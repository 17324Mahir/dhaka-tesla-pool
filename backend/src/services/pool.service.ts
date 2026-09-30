import { PoolStatus, Prisma, RideStatus } from "@prisma/client";
import prisma from "../prisma/client";
import { calculateFare, recalculatePoolFares } from "./fare.service";
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

export class RideAlreadyAssignedError extends PoolMatchError {
  constructor() {
    super("Ride request was already accepted by another driver");
  }
}

async function matchInTransaction(rideId: string, driverId?: string) {
  return prisma.$transaction(
    async (tx) => {
      const ride = await tx.ride.findUnique({
        where: { id: rideId },
        include: {
          poolMember: {
            include: { pool: { include: { tesla: true } } },
          },
        },
      });

      if (!ride) {
        throw new PoolMatchError("Ride not found");
      }

      if (ride.poolMember) {
        if (
          driverId &&
          ride.poolMember.pool.tesla.driverId !== driverId
        ) {
          throw new RideAlreadyAssignedError();
        }

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
          status: { in: [PoolStatus.WAITING, PoolStatus.ACTIVE] },
          tesla: {
            isOnline: true,
            currentArea: ride.pickup,
            ...(driverId ? { driverId } : {}),
            capacity: { gte: ride.seats },
          },
          members: {
            some: {
              ride: {
                pickup: ride.pickup,
                status: {
                  in: [RideStatus.MATCHED, RideStatus.DRIVER_ARRIVED],
                },
              },
            },
            none: {
              ride: {
                status: { in: [RideStatus.STARTED, RideStatus.COMPLETED] },
              },
            },
          },
        },
        include: {
          tesla: true,
          members: {
            select: {
              seats: true,
              ride: {
                select: { pickup: true, destination: true, status: true },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      });

      let selectedPool = candidatePools.find((pool) => {
        const activeMembers = pool.members.filter(
          (member) =>
            member.ride.status !== RideStatus.COMPLETED &&
            member.ride.status !== RideStatus.CANCELLED,
        );
        const usedSeats = activeMembers.reduce(
          (total, member) => total + member.seats,
          0,
        );

        const routeMember = activeMembers[0];
        const pickup = routeMember?.ride.pickup;
        const destination = routeMember?.ride.destination;
        const hasDepartedRide = pool.members.some(
          (member) =>
            member.ride.status === RideStatus.STARTED ||
            member.ride.status === RideStatus.COMPLETED,
        );

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
                hasDepartedRide,
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
            currentArea: ride.pickup,
            ...(driverId ? { driverId } : {}),
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
                ride: {
                  select: { pickup: true, destination: true, status: true },
                },
              },
            },
          },
        });

        selectedPool = newPool;
      }

      const estimatedFare = calculateFare(
        ride.pickup,
        ride.destination,
        false,
      );

      await tx.poolMember.create({
        data: {
          poolId: selectedPool.id,
          rideId: ride.id,
          seats: ride.seats,
          individualFare: estimatedFare,
        },
      });

      await tx.ride.update({
        where: { id: ride.id },
        data: {
          status: RideStatus.MATCHED,
          statusHistory: { create: { status: RideStatus.MATCHED } },
        },
      });

      await recalculatePoolFares(tx, selectedPool.id);

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

export async function matchRideToDriver(rideId: string, driverId: string) {
  return withPoolMatchRetries(() => matchInTransaction(rideId, driverId));
}

export async function matchWaitingRides(limit = 50): Promise<number> {
  const waitingRides = await prisma.ride.findMany({
    where: { status: RideStatus.REQUESTED, poolMember: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let matchedCount = 0;

  for (const waitingRide of waitingRides) {
    try {
      await matchRideToPool(waitingRide.id);
      matchedCount += 1;
    } catch (error) {
      if (
        error instanceof NoTeslaAvailableError ||
        error instanceof PoolMatchError
      ) {
        continue;
      }

      throw error;
    }
  }

  return matchedCount;
}
