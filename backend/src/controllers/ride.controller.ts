import { RideStatus } from "@prisma/client";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../prisma/client";

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

    if (
      typeof pickup !== "string" ||
      typeof destination !== "string" ||
      !pickup.trim() ||
      !destination.trim() ||
      !Number.isInteger(seats) ||
      seats < 1
    ) {
      res.status(400).json({
        message: "Pickup, destination, and a positive seat count are required",
      });
      return;
    }

    if (pickup.trim().toLowerCase() === destination.trim().toLowerCase()) {
      res.status(400).json({
        message: "Pickup and destination must be different",
      });
      return;
    }

    const ride = await prisma.ride.create({
      data: {
        passengerId: req.user.id,
        pickup: pickup.trim(),
        destination: destination.trim(),
        seats,
        fare: 0,
        status: RideStatus.REQUESTED,
      },
    });

    res.status(201).json({ message: "Ride requested", ride });
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

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: { status: RideStatus.CANCELLED },
    });

    res.json({ message: "Ride cancelled", ride: updatedRide });
  } catch (error) {
    console.error("Cancellation failed:", error);
    res.status(500).json({ message: "Cancellation failed" });
  }
};
