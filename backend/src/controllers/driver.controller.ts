import { PoolStatus, RideStatus } from "@prisma/client";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../prisma/client";
import { canTransitionRide } from "../services/ride-state.service";

const activeRideStatuses = [
  RideStatus.MATCHED,
  RideStatus.DRIVER_ARRIVED,
  RideStatus.STARTED,
];

const getResourceId = (req: AuthRequest): string => {
  const value = req.params.id;

  if (typeof value !== "string") {
    throw new TypeError("Validated resource ID is missing");
  }

  return value;
};

export const getDriverRides = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }

    const rides = await prisma.ride.findMany({
      where: {
        status: { in: activeRideStatuses },
        poolMember: {
          pool: {
            tesla: { driverId: req.user.id },
            status: { in: [PoolStatus.WAITING, PoolStatus.ACTIVE] },
          },
        },
      },
      include: {
        passenger: { select: { id: true, name: true } },
        poolMember: {
          select: {
            pool: {
              select: {
                id: true,
                status: true,
                tesla: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(rides);
  } catch (error) {
    console.error("Cannot fetch driver rides:", error);
    res.status(500).json({ message: "Cannot fetch driver rides" });
  }
};

export const acceptPool = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }

    const id = getResourceId(req);
    const pool = await prisma.pool.findUnique({
      where: { id },
      include: {
        tesla: true,
        members: { select: { id: true } },
      },
    });

    if (!pool) {
      res.status(404).json({ message: "Pool not found" });
      return;
    }

    if (pool.tesla.driverId !== req.user.id) {
      res.status(403).json({ message: "This pool is assigned to another driver" });
      return;
    }

    if (!pool.tesla.isOnline) {
      res.status(409).json({ message: "Your Tesla must be online to accept a pool" });
      return;
    }

    if (pool.members.length === 0) {
      res.status(409).json({ message: "An empty pool cannot be accepted" });
      return;
    }

    if (pool.status !== PoolStatus.WAITING) {
      res.status(409).json({
        message: `Pool cannot be accepted while it is ${pool.status}`,
      });
      return;
    }

    const updated = await prisma.pool.updateMany({
      where: { id, status: PoolStatus.WAITING },
      data: { status: PoolStatus.ACTIVE },
    });

    if (updated.count !== 1) {
      res.status(409).json({ message: "Pool state changed; refresh and try again" });
      return;
    }

    res.json({ message: "Pool accepted", poolId: id });
  } catch (error) {
    console.error("Cannot accept pool:", error);
    res.status(500).json({ message: "Cannot accept pool" });
  }
};

async function transitionRide(
  req: AuthRequest,
  res: Response,
  nextStatus: RideStatus,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }

    const id = getResourceId(req);
    const result = await prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({
        where: { id },
        include: {
          poolMember: {
            include: {
              pool: { include: { tesla: true } },
            },
          },
        },
      });

      if (!ride) {
        return {
          ok: false,
          error: "Ride not found",
          status: 404,
        } as const;
      }

      const pool = ride.poolMember?.pool;

      if (!pool || pool.tesla.driverId !== req.user?.id) {
        return {
          ok: false,
          error: "This ride is not assigned to your Tesla",
          status: 403,
        } as const;
      }

      if (pool.status !== PoolStatus.ACTIVE) {
        return {
          ok: false,
          error: "Accept the pool before updating its rides",
          status: 409,
        } as const;
      }

      if (!canTransitionRide(ride.status, nextStatus)) {
        return {
          ok: false,
          error: `Ride cannot move from ${ride.status} to ${nextStatus}`,
          status: 409,
        } as const;
      }

      const update = await tx.ride.updateMany({
        where: { id, status: ride.status },
        data: { status: nextStatus },
      });

      if (update.count !== 1) {
        return {
          ok: false,
          error: "Ride state changed; refresh and try again",
          status: 409,
        } as const;
      }

      const updatedRide = await tx.ride.findUniqueOrThrow({ where: { id } });

      if (nextStatus === RideStatus.COMPLETED) {
        const remainingRides = await tx.ride.count({
          where: {
            poolMember: { poolId: pool.id },
            status: {
              notIn: [RideStatus.COMPLETED, RideStatus.CANCELLED],
            },
          },
        });

        if (remainingRides === 0) {
          await tx.pool.update({
            where: { id: pool.id },
            data: { status: PoolStatus.COMPLETED },
          });
        }
      }

      return { ok: true, ride: updatedRide } as const;
    });

    if (!result.ok) {
      res.status(result.status).json({ message: result.error });
      return;
    }

    res.json({
      message: `Ride status updated to ${nextStatus}`,
      ride: result.ride,
    });
  } catch (error) {
    console.error(`Cannot update ride to ${nextStatus}:`, error);
    res.status(500).json({ message: "Cannot update ride status" });
  }
}

export const markArrival = (req: AuthRequest, res: Response): Promise<void> =>
  transitionRide(req, res, RideStatus.DRIVER_ARRIVED);

export const startTrip = (req: AuthRequest, res: Response): Promise<void> =>
  transitionRide(req, res, RideStatus.STARTED);

export const completeTrip = (req: AuthRequest, res: Response): Promise<void> =>
  transitionRide(req, res, RideStatus.COMPLETED);
