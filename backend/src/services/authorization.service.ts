export function isRideOwner(
  passengerId: string,
  requestingUserId: string,
): boolean {
  return passengerId === requestingUserId;
}
