import { PoolStatus, Prisma, RideStatus } from "@prisma/client";
import prisma from "../prisma/client";
import { calculateFare } from "./fare.service";
import { isPoolMatchEligible } from "./matching.service";
import { canTransitionRide } from "./ride-state.service";

const MAX_TRANSACTION_ATTEMPTS = 3;

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
            select: {
              seats: true,
              ride: { select: { pickup: true } },
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

        return Boolean(
          pickup &&
            isPoolMatchEligible(
              {
                pickup,
                status: pool.status,
                isTeslaOnline: pool.tesla.isOnline,
                capacity: pool.tesla.capacity,
                usedSeats,
              },
              { pickup: ride.pickup, seats: ride.seats },
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
                ride: { select: { pickup: true } },
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
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await matchInTransaction(rideId);
    } catch (error) {
      const shouldRetry =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < MAX_TRANSACTION_ATTEMPTS;

      if (!shouldRetry) {
        throw error;
      }
    }
  }

  throw new PoolMatchError("Pool matching failed");
}
