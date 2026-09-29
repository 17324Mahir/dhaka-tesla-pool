import { Role } from "@prisma/client";
import { Router } from "express";
import { getMyPool } from "../controllers/pool.controller";
import {
  authenticate,
} from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

router.get(
  "/my",
  authenticate,
  authorizeRoles(Role.PASSENGER),
  getMyPool,
);

export default router;
