const BASE_FARE_BDT = 50;
const DISTANCE_CHARGE_BDT = 100;
const POOL_DISCOUNT_BDT = 20;
const PAISA_PER_BDT = 100;

export function calculateFare(seats: number, isPooled: boolean): number {
  if (!Number.isInteger(seats) || seats < 1) {
    throw new RangeError("Seats must be a positive integer");
  }

  const poolDiscount = isPooled ? POOL_DISCOUNT_BDT : 0;
  const finalFareBdt =
    BASE_FARE_BDT + DISTANCE_CHARGE_BDT - poolDiscount;

  return finalFareBdt * PAISA_PER_BDT;
}

export function calculateReceipt(fare: number, tip: number) {
  if (
    !Number.isInteger(fare) ||
    !Number.isInteger(tip) ||
    fare < 0 ||
    tip < 0
  ) {
    throw new RangeError("Fare and tip must be non-negative integer paisa");
  }

  return { fare, tip, total: fare + tip };
}
