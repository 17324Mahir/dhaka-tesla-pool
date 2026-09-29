import { PoolStatus, Prisma, RideStatus } from "@prisma/client";
import prisma from "../prisma/client";
import { hasPoolCapacity } from "./capacity.service";
import { calculateFare } from "./fare.service";
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
          members: { select: { seats: true } },
        },
        orderBy: { id: "asc" },
      });

      let selectedPool = candidatePools.find((pool) => {
        const usedSeats = pool.members.reduce(
          (total, member) => total + member.seats,
          0,
        );

        return hasPoolCapacity(
          pool.tesla.capacity,
          usedSeats,
          ride.seats,
        );
      });

      if (!selectedPool) {
        const tesla = await tx.tesla.findFirst({
          where: {
            isOnline: true,
            capacity: { gte: ride.seats },
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
            members: { select: { seats: true } },
          },
        });

        selectedPool = newPool;
      }

      const usedSeats = selectedPool.members.reduce(
        (total, member) => total + member.seats,
        0,
      );
      const totalSeats = usedSeats + ride.seats;
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

      if (totalSeats === selectedPool.tesla.capacity) {
        await tx.pool.update({
          where: { id: selectedPool.id },
          data: { status: PoolStatus.ACTIVE },
        });
      }

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
