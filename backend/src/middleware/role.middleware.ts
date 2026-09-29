import { Role } from "@prisma/client";
import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";

export const authorizeRoles =
  (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "You do not have access to this resource" });
      return;
    }

    next();
  };
