import { Role } from "@prisma/client";
import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(254)
  .transform((email) => email.toLowerCase());

export const registerBodySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: z.string().min(6).max(72),
    role: z.enum([Role.PASSENGER, Role.DRIVER]),
  })
  .strict();

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(72),
  })
  .strict();

const areaSchema = z
  .enum([
    "Banani",
    "Gulshan",
    "Mohakhali",
    "Dhanmondi",
    "Mirpur",
    "Uttara",
    "Farmgate",
    "Bashundhara",
  ])
  .or(
    z.string().trim().transform((value, context) => {
      const areas = [
        "Banani",
        "Gulshan",
        "Mohakhali",
        "Dhanmondi",
        "Mirpur",
        "Uttara",
        "Farmgate",
        "Bashundhara",
      ] as const;
      const canonicalArea = areas.find(
        (area) => area.toLowerCase() === value.toLowerCase(),
      );

      if (!canonicalArea) {
        context.addIssue({
          code: "custom",
          message: "Choose a supported Dhaka area",
        });
        return z.NEVER;
      }

      return canonicalArea;
    }),
  );

export const createRideBodySchema = z
  .object({
    pickup: areaSchema,
    destination: areaSchema,
    seats: z.number().int().min(1).max(3),
  })
  .strict()
  .refine((body) => body.pickup !== body.destination, {
    message: "Pickup and destination must be different",
    path: ["destination"],
  });

export const resourceIdParamsSchema = z.object({
  id: z.string().uuid("Invalid resource ID"),
});

export const driverStatusBodySchema = z
  .object({ isOnline: z.boolean() })
  .strict();

export const rideStatusBodySchema = z
  .object({
    status: z.enum([
      "DRIVER_ARRIVED",
      "STARTED",
      "COMPLETED",
      "CANCELLED",
    ]),
  })
  .strict();

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type CreateRideBody = z.infer<typeof createRideBodySchema>;
export type DriverStatusBody = z.infer<typeof driverStatusBodySchema>;
export type RideStatusBody = z.infer<typeof rideStatusBodySchema>;
