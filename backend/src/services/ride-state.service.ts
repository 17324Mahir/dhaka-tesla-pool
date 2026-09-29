import { RideStatus } from "@prisma/client";

const allowedTransitions: Record<RideStatus, readonly RideStatus[]> = {
  [RideStatus.REQUESTED]: [RideStatus.MATCHED, RideStatus.CANCELLED],
  [RideStatus.MATCHED]: [RideStatus.DRIVER_ARRIVED, RideStatus.CANCELLED],
  [RideStatus.DRIVER_ARRIVED]: [RideStatus.STARTED],
  [RideStatus.STARTED]: [RideStatus.COMPLETED],
  [RideStatus.COMPLETED]: [],
  [RideStatus.CANCELLED]: [],
};

export function canTransitionRide(
  currentStatus: RideStatus,
  nextStatus: RideStatus,
): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus);
}
