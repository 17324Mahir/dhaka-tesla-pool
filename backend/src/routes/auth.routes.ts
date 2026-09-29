import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validation.middleware";
import {
  loginBodySchema,
  registerBodySchema,
} from "../validation/request.schemas";

const router = Router();

router.post("/register", validateBody(registerBodySchema), register);
router.post("/login", validateBody(loginBodySchema), login);

export default router;
