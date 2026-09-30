import { Role } from "@prisma/client";
import { Router } from "express";
import {
  cancelRide,
  createRide,
  getMyRides,
  updateRideTip,
} from "../controllers/ride.controller";
import { updateRideStatus } from "../controllers/driver.controller";
import {
  authenticate,
} from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
  validateBody,
  validateParams,
} from "../middleware/validation.middleware";
import {
  createRideBodySchema,
  resourceIdParamsSchema,
  rideStatusBodySchema,
  rideTipBodySchema,
} from "../validation/request.schemas";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles(Role.PASSENGER),
  validateBody(createRideBodySchema),
  createRide,
);
router.get(
  "/history",
  authenticate,
  authorizeRoles(Role.PASSENGER),
  getMyRides,
);
router.get(
  "/my",
  authenticate,
  authorizeRoles(Role.PASSENGER),
  getMyRides,
);
router.patch(
  "/:id/cancel",
  authenticate,
  authorizeRoles(Role.PASSENGER),
  validateParams(resourceIdParamsSchema),
  cancelRide,
);
router.patch(
  "/:id/tip",
  authenticate,
  authorizeRoles(Role.PASSENGER),
  validateParams(resourceIdParamsSchema),
  validateBody(rideTipBodySchema),
  updateRideTip,
);
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles(Role.DRIVER),
  validateParams(resourceIdParamsSchema),
  validateBody(rideStatusBodySchema),
  updateRideStatus,
);

export default router;
