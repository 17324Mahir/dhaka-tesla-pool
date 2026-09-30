import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../prisma/client";
import { toPassengerPoolView } from "../services/pool-view.service";

export const getMyPool = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const pools = await prisma.pool.findMany({
      where: {
        status: { in: ["WAITING", "ACTIVE"] },
        members: {
          some: {
            ride: { passengerId: req.user.id },
          },
        },
      },
      select: {
        id: true,
        status: true,
        tesla: { select: { id: true, name: true, capacity: true } },
        members: {
          select: {
            id: true,
            seats: true,
            individualFare: true,
            ride: {
              select: {
                id: true,
                passengerId: true,
                pickup: true,
                destination: true,
                seats: true,
                status: true,
                fare: true,
                createdAt: true,
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });

    const safePools = pools.map((pool) =>
      toPassengerPoolView(pool, req.user!.id),
    );

    res.json(safePools);
  } catch (error) {
    console.error("Cannot fetch pool:", error);
    res.status(500).json({ message: "Cannot fetch pool" });
  }
};
