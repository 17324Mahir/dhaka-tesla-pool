import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "./client";

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const driver = await prisma.user.upsert({
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

  await prisma.tesla.upsert({
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

  const passengers = [
    { name: "Nusrat", email: "nusrat@test.com" },
    { name: "Rafiq", email: "rafiq@test.com" },
    { name: "Shirin", email: "shirin@test.com" },
  ];

  await Promise.all(
    passengers.map(({ name, email }) =>
      prisma.user.upsert({
        where: { email },
        update: { name, password, role: Role.PASSENGER },
        create: { name, email, password, role: Role.PASSENGER },
      }),
    ),
  );

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
