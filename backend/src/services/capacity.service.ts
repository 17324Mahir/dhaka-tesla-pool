export function hasPoolCapacity(
  capacity: number,
  usedSeats: number,
  requestedSeats: number,
): boolean {
  const values = [capacity, usedSeats, requestedSeats];

  if (values.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new RangeError("Capacity and seat counts must be non-negative integers");
  }

  if (requestedSeats === 0) {
    throw new RangeError("Requested seats must be greater than zero");
  }

  return usedSeats + requestedSeats <= capacity;
}
