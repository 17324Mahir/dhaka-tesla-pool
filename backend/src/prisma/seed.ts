import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "./client";

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

    await tx.tesla.upsert({
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

    for (const { name, email } of passengers) {
      await tx.user.upsert({
        where: { email },
        update: { name, password, role: Role.PASSENGER },
        create: { name, email, password, role: Role.PASSENGER },
      });
    }
  });

  console.log("Seed completed: 4 demo users and 1 Tesla are ready");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
