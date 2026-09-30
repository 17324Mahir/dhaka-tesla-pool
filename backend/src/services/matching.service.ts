import { PoolStatus } from "@prisma/client";
import zones from "../data/zones.json";
import { hasPoolCapacity } from "./capacity.service";

const MAX_DESTINATION_DISTANCE_KM = 5;

type ZoneName = keyof typeof zones;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function destinationDistanceKm(from: string, to: string): number {
  const first = zones[from as ZoneName];
  const second = zones[to as ZoneName];

  if (!first || !second) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(second.lat - first.lat);
  const longitudeDelta = toRadians(second.lng - first.lng);
  const firstLatitude = toRadians(first.lat);
  const secondLatitude = toRadians(second.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export function areDestinationsCompatible(from: string, to: string): boolean {
  return destinationDistanceKm(from, to) <= MAX_DESTINATION_DISTANCE_KM;
}

interface PoolCandidate {
  pickup: string;
  destination: string;
  status: PoolStatus;
  isTeslaOnline: boolean;
  capacity: number;
  usedSeats: number;
}

interface RideRequest {
  pickup: string;
  destination: string;
  seats: number;
}

export function isPoolMatchEligible(
  pool: PoolCandidate,
  ride: RideRequest,
): boolean {
  return (
    pool.pickup === ride.pickup &&
    areDestinationsCompatible(pool.destination, ride.destination) &&
    pool.status === PoolStatus.WAITING &&
    pool.isTeslaOnline &&
    hasPoolCapacity(pool.capacity, pool.usedSeats, ride.seats)
  );
}
