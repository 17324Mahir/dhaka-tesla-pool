import { PoolStatus, RideStatus } from "@prisma/client";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../prisma/client";
import {
  matchRideToPool,
  NoTeslaAvailableError,
} from "../services/pool.service";

const DHAKA_AREAS = [
  "Banani",
  "Gulshan",
  "Mohakhali",
  "Dhanmondi",
  "Mirpur",
  "Uttara",
  "Farmgate",
  "Bashundhara",
] as const;

const getCanonicalArea = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = value.trim().toLowerCase();
  return DHAKA_AREAS.find(
    (area) => area.toLowerCase() === normalizedValue,
  );
};

export const createRide = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { pickup, destination, seats } = req.body;
    const canonicalPickup = getCanonicalArea(pickup);
    const canonicalDestination = getCanonicalArea(destination);

    if (
      !canonicalPickup ||
      !canonicalDestination ||
      !Number.isInteger(seats) ||
      seats < 1
    ) {
      res.status(400).json({
        message:
          "Supported pickup and destination areas and a positive seat count are required",
      });
      return;
    }

    if (canonicalPickup === canonicalDestination) {
      res.status(400).json({
        message: "Pickup and destination must be different",
      });
      return;
    }

    const ride = await prisma.ride.create({
      data: {
        passengerId: req.user.id,
        pickup: canonicalPickup,
        destination: canonicalDestination,
        seats,
        fare: 0,
        status: RideStatus.REQUESTED,
      },
    });

    try {
      const pool = await matchRideToPool(ride.id);
      const matchedRide = pool.members.find(
        (member) => member.rideId === ride.id,
      )?.ride;

      res.status(201).json({
        message: "Ride requested and matched",
        ride: matchedRide ?? ride,
        poolId: pool.id,
      });
    } catch (error) {
      if (error instanceof NoTeslaAvailableError) {
        res.status(202).json({
          message: "Ride requested; waiting for an available Tesla",
          ride,
        });
        return;
      }

      throw error;
    }
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
      orderBy: { createdAt: "desc" },
    });

    res.json(rides);
  } catch (error) {
    console.error("Cannot fetch rides:", error);
    res.status(500).json({ message: "Cannot fetch rides" });
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

    if (ride.passengerId !== req.user.id) {
      res.status(403).json({ message: "Not your ride" });
      return;
    }

    if (
      ride.status !== RideStatus.REQUESTED &&
      ride.status !== RideStatus.MATCHED
    ) {
      res.status(400).json({
        message: "Ride can no longer be cancelled",
      });
      return;
    }

    const updatedRide = await prisma.$transaction(async (tx) => {
      const updated = await tx.ride.update({
        where: { id },
        data: { status: RideStatus.CANCELLED },
      });

      const membership = await tx.poolMember.findUnique({
        where: { rideId: id },
      });

      if (membership) {
        await tx.poolMember.delete({ where: { rideId: id } });

        const remainingMembers = await tx.poolMember.count({
          where: { poolId: membership.poolId },
        });

        if (remainingMembers === 0) {
          await tx.pool.delete({ where: { id: membership.poolId } });
        } else {
          await tx.pool.update({
            where: { id: membership.poolId },
            data: { status: PoolStatus.WAITING },
          });
        }
      }

      return updated;
    });

    res.json({ message: "Ride cancelled", ride: updatedRide });
  } catch (error) {
    console.error("Cancellation failed:", error);
    res.status(500).json({ message: "Cancellation failed" });
  }
};
