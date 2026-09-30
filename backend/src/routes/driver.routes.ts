import { Role } from "@prisma/client";
import { Router } from "express";
import {
  acceptPool,
  cancelTrip,
  completeTrip,
  getDriverDashboard,
  getDriverRides,
  markArrival,
  setDriverStatus,
  startTrip,
} from "../controllers/driver.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
  validateBody,
  validateParams,
} from "../middleware/validation.middleware";
import {
  driverStatusBodySchema,
  resourceIdParamsSchema,
} from "../validation/request.schemas";

const router = Router();

router.use(authenticate, authorizeRoles(Role.DRIVER));

router.get("/dashboard", getDriverDashboard);
router.get("/rides", getDriverRides);
router.patch("/status", validateBody(driverStatusBodySchema), setDriverStatus);
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
router.patch(
  "/ride/:id/cancel",
  validateParams(resourceIdParamsSchema),
  cancelTrip,
);

export default router;
