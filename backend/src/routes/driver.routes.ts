import { Role } from "@prisma/client";
import { Router } from "express";
import {
  acceptPool,
  completeTrip,
  getDriverRides,
  markArrival,
  startTrip,
} from "../controllers/driver.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { validateParams } from "../middleware/validation.middleware";
import { resourceIdParamsSchema } from "../validation/request.schemas";

const router = Router();

router.use(authenticate, authorizeRoles(Role.DRIVER));

router.get("/rides", getDriverRides);
router.patch(
  "/pool/:id/accept",
  validateParams(resourceIdParamsSchema),
  acceptPool,
);
router.patch(
  "/ride/:id/arrival",
  validateParams(resourceIdParamsSchema),
  markArrival,
);
router.patch(
  "/ride/:id/start",
  validateParams(resourceIdParamsSchema),
  startTrip,
);
router.patch(
  "/ride/:id/complete",
  validateParams(resourceIdParamsSchema),
  completeTrip,
);

export default router;
