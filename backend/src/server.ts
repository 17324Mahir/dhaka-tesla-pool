import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Role } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import {
  authenticate,
  authorizeRoles,
} from "./middleware/auth.middleware";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Dhaka Tesla Pool API running",
  });
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
