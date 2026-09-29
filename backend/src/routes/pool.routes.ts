import { Role } from "@prisma/client";
import { Router } from "express";
import { getMyPool } from "../controllers/pool.controller";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/my",
  authenticate,
  authorizeRoles(Role.PASSENGER),
  getMyPool,
);

export default router;
