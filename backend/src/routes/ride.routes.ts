import { Role } from "@prisma/client";
import { Router } from "express";
import {
  cancelRide,
  createRide,
  getMyRides,
} from "../controllers/ride.controller";
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
} from "../validation/request.schemas";

const router = Router();

router.use(authenticate, authorizeRoles(Role.PASSENGER));

router.post("/", validateBody(createRideBodySchema), createRide);
router.get("/my", getMyRides);
router.patch(
  "/:id/cancel",
  validateParams(resourceIdParamsSchema),
  cancelRide,
);

export default router;
