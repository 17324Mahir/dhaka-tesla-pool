import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Role } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import rideRoutes from "./routes/ride.routes";
import poolRoutes from "./routes/pool.routes";
import driverRoutes from "./routes/driver.routes";
import { authenticate } from "./middleware/auth.middleware";
import { authorizeRoles } from "./middleware/role.middleware";
import { errorHandler } from "./middleware/error.middleware";
import prisma from "./prisma/client";

dotenv.config();

const app = express();
const allowedOrigins = (
  process.env.CORS_ORIGINS ??
  "http://localhost:3000,https://dhaka-tesla-pool-three.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use("/auth", authRoutes);
app.use("/rides", rideRoutes);
app.use("/pool", poolRoutes);
app.use("/driver", driverRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Dhaka Tesla Pool API running",
  });
});

app.get("/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch (error) {
    console.error("Readiness check failed:", error);
    res.status(503).json({ ready: false, message: "Database is not ready" });
  }
});

app.get("/profile", authenticate, (_req, res) => {
  res.json({ message: "Protected route" });
});

app.get(
  "/driver-only",
  authenticate,
  authorizeRoles(Role.DRIVER),
  (_req, res) => {
    res.json({ message: "Driver route" });
  },
);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
