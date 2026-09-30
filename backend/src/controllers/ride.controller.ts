import { RideStatus } from "@prisma/client";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../prisma/client";
import { isRideOwner } from "../services/authorization.service";
import { canTransitionRide } from "../services/ride-state.service";
import { calculateFare, calculateReceipt } from "../services/fare.service";
import {
  CreateRideBody,
  RideTipBody,
} from "../validation/request.schemas";

export const createRide = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { pickup, destination, seats } = req.body as CreateRideBody;

    const ride = await prisma.ride.create({
      data: {
        passengerId: req.user.id,
        pickup,
        destination,
        seats,
        fare: calculateFare(seats, false),
        status: RideStatus.REQUESTED,
        statusHistory: { create: { status: RideStatus.REQUESTED } },
      },
    });

    res.status(202).json({
      message: "Ride requested; waiting for a nearby driver to accept",
      ride,
    });
  } catch (error) {
    console.error("Ride creation failed:", error);
    res.status(500).json({ message: "Ride creation failed" });
  }
};

export const getMyRides = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const rides = await prisma.ride.findMany({
      where: { passengerId: req.user.id },
      include: {
        statusHistory: { orderBy: { createdAt: "asc" } },
        poolMember: {
          select: {
            individualFare: true,
            pool: {
              select: {
                id: true,
                tesla: {
                  select: {
                    name: true,
                    driver: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      rides.map((ride) => ({
        ...ride,
        receipt: calculateReceipt(ride.fare, ride.tip),
      })),
    );
  } catch (error) {
    console.error("Cannot fetch rides:", error);
    res.status(500).json({ message: "Cannot fetch rides" });
  }
};

export const updateRideTip = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { tip } = req.body as RideTipBody;

    if (typeof id !== "string") {
      res.status(400).json({ message: "Invalid ride ID" });
      return;
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
      select: { passengerId: true, status: true, fare: true },
    });

    if (!ride) {
      res.status(404).json({ message: "Ride not found" });
      return;
    }

    if (!isRideOwner(ride.passengerId, req.user.id)) {
      res.status(403).json({ message: "Not your ride" });
      return;
    }

    if (ride.status !== RideStatus.COMPLETED) {
      res.status(409).json({ message: "Tips can be added after trip completion" });
      return;
    }

    const update = await prisma.ride.updateMany({
      where: {
        id,
        passengerId: req.user.id,
        status: RideStatus.COMPLETED,
      },
      data: { tip, tipUpdatedAt: new Date() },
    });

    if (update.count !== 1) {
      res.status(409).json({ message: "Ride state changed; refresh and try again" });
      return;
    }

    res.json({
      message: "Tip updated",
      rideId: id,
      receipt: calculateReceipt(ride.fare, tip),
    });
  } catch (error) {
    console.error("Tip update failed:", error);
    res.status(500).json({ message: "Tip update failed" });
  }
};

export const cancelRide = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    if (typeof id !== "string" || !id) {
      res.status(400).json({ message: "Invalid ride ID" });
      return;
    }

    const ride = await prisma.ride.findUnique({ where: { id } });

    if (!ride) {
      res.status(404).json({ message: "Ride not found" });
      return;
    }

    if (!isRideOwner(ride.passengerId, req.user.id)) {
      res.status(403).json({ message: "Not your ride" });
      return;
    }

    if (!canTransitionRide(ride.status, RideStatus.CANCELLED)) {
      res.status(400).json({
        message: "Ride can no longer be cancelled",
      });
      return;
    }

    const updatedRide = await prisma.$transaction(async (tx) => {
      const update = await tx.ride.updateMany({
        where: { id, status: ride.status },
        data: { status: RideStatus.CANCELLED },
      });

      if (update.count !== 1) {
        return null;
      }

      await tx.rideStatusHistory.create({
        data: { rideId: id, status: RideStatus.CANCELLED },
      });

      const membership = await tx.poolMember.findUnique({
        where: { rideId: id },
      });

      if (membership) {
        const remainingRides = await tx.ride.count({
          where: {
            poolMember: { poolId: membership.poolId },
            status: {
              notIn: [RideStatus.COMPLETED, RideStatus.CANCELLED],
            },
          },
        });

        if (remainingRides === 0) {
          await tx.pool.update({
            where: { id: membership.poolId },
            data: { status: "CANCELLED" },
          });
        }
      }

      return tx.ride.findUniqueOrThrow({ where: { id } });
    });

    if (!updatedRide) {
      res.status(409).json({ message: "Ride state changed; refresh and try again" });
      return;
    }

    res.json({ message: "Ride cancelled", ride: updatedRide });
  } catch (error) {
    console.error("Cancellation failed:", error);
    res.status(500).json({ message: "Cancellation failed" });
  }
};
