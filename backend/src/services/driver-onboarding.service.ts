import prisma from "../prisma/client";

export const DEFAULT_TESLA_CAPACITY = 3;

export const createDefaultTeslaData = (
  driverId: string,
  driverName: string,
) => ({
  driverId,
  name: `${driverName.trim() || "Driver"}'s Tesla`,
  capacity: DEFAULT_TESLA_CAPACITY,
  isOnline: false,
  currentArea: null,
});

export const ensureDriverTesla = async (
  driverId: string,
  driverName: string,
) =>
  prisma.tesla.upsert({
    where: { driverId },
    update: {},
    create: createDefaultTeslaData(driverId, driverName),
  });
