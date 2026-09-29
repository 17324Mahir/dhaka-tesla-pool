import { Role } from "@prisma/client";
import { Router } from "express";
import {
  cancelRide,
  createRide,
  getMyRides,
} from "../controllers/ride.controller";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate, authorizeRoles(Role.PASSENGER));

router.post("/", createRide);
router.get("/my", getMyRides);
router.patch("/:id/cancel", cancelRide);

export default router;
