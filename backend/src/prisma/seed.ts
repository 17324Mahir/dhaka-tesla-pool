import { PoolStatus, RideStatus, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "./client";
import { calculateFare } from "../services/fare.service";

const SEED_IDS = {
  pool: "00000000-0000-4000-8000-000000000001",
  nusratRide: "00000000-0000-4000-8000-000000000002",
  rafiqRide: "00000000-0000-4000-8000-000000000003",
  nusratMember: "00000000-0000-4000-8000-000000000004",
  rafiqMember: "00000000-0000-4000-8000-000000000005",
} as const;

async function main() {
  const password = await bcrypt.hash("password123", 10);
  const passengers = [
    { name: "Nusrat", email: "nusrat@test.com" },
    { name: "Rafiq", email: "rafiq@test.com" },
    { name: "Shirin", email: "shirin@test.com" },
  ];

  await prisma.$transaction(async (tx) => {
    const driver = await tx.user.upsert({
      where: { email: "jashim@test.com" },
      update: {
        name: "Jashim",
        password,
        role: Role.DRIVER,
      },
      create: {
        name: "Jashim",
        email: "jashim@test.com",
        password,
        role: Role.DRIVER,
      },
    });

    const tesla = await tx.tesla.upsert({
      where: { driverId: driver.id },
      update: {
        name: "Bullet",
        capacity: 3,
        isOnline: true,
      },
      create: {
        name: "Bullet",
        capacity: 3,
        driverId: driver.id,
        isOnline: true,
      },
    });

    const seededPassengers = new Map<string, { id: string }>();

    for (const { name, email } of passengers) {
      const passenger = await tx.user.upsert({
        where: { email },
        update: { name, password, role: Role.PASSENGER },
        create: { name, email, password, role: Role.PASSENGER },
      });
      seededPassengers.set(email, passenger);
    }

    const nusrat = seededPassengers.get("nusrat@test.com");
    const rafiq = seededPassengers.get("rafiq@test.com");

    if (!nusrat || !rafiq) {
      throw new Error("Seed passengers could not be created");
    }

    const pooledFare = calculateFare(1, true);
    await tx.ride.upsert({
      where: { id: SEED_IDS.nusratRide },
      update: {
        passengerId: nusrat.id,
        pickup: "Banani",
        destination: "Mohakhali",
        seats: 1,
        status: RideStatus.MATCHED,
        fare: pooledFare,
      },
      create: {
        id: SEED_IDS.nusratRide,
        passengerId: nusrat.id,
        pickup: "Banani",
        destination: "Mohakhali",
        seats: 1,
        status: RideStatus.MATCHED,
        fare: pooledFare,
      },
    });

    await tx.ride.upsert({
      where: { id: SEED_IDS.rafiqRide },
      update: {
        passengerId: rafiq.id,
        pickup: "Banani",
        destination: "Gulshan",
        seats: 1,
        status: RideStatus.MATCHED,
        fare: pooledFare,
      },
      create: {
        id: SEED_IDS.rafiqRide,
        passengerId: rafiq.id,
        pickup: "Banani",
        destination: "Gulshan",
        seats: 1,
        status: RideStatus.MATCHED,
        fare: pooledFare,
      },
    });

    await tx.pool.upsert({
      where: { id: SEED_IDS.pool },
      update: { teslaId: tesla.id, status: PoolStatus.WAITING },
      create: {
        id: SEED_IDS.pool,
        teslaId: tesla.id,
        status: PoolStatus.WAITING,
      },
    });

    await tx.poolMember.upsert({
      where: { id: SEED_IDS.nusratMember },
      update: {
        poolId: SEED_IDS.pool,
        rideId: SEED_IDS.nusratRide,
        seats: 1,
        individualFare: pooledFare,
      },
      create: {
        id: SEED_IDS.nusratMember,
        poolId: SEED_IDS.pool,
        rideId: SEED_IDS.nusratRide,
        seats: 1,
        individualFare: pooledFare,
      },
    });

    await tx.poolMember.upsert({
      where: { id: SEED_IDS.rafiqMember },
      update: {
        poolId: SEED_IDS.pool,
        rideId: SEED_IDS.rafiqRide,
        seats: 1,
        individualFare: pooledFare,
      },
      create: {
        id: SEED_IDS.rafiqMember,
        poolId: SEED_IDS.pool,
        rideId: SEED_IDS.rafiqRide,
        seats: 1,
        individualFare: pooledFare,
      },
    });
  });

  console.log(
    "Seed completed: demo users, Tesla Bullet, and a two-passenger pool are ready",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
