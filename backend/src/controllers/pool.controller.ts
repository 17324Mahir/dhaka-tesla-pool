import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../prisma/client";

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
        members: {
          some: {
            ride: { passengerId: req.user.id },
          },
        },
      },
      include: {
        tesla: true,
        members: {
          include: { ride: true },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json(pools);
  } catch (error) {
    console.error("Cannot fetch pool:", error);
    res.status(500).json({ message: "Cannot fetch pool" });
  }
};
