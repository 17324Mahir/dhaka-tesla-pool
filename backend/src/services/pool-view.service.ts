interface PassengerPoolMember {
  id: string;
  seats: number;
  individualFare: number;
  ride: {
    id: string;
    passengerId: string;
    pickup: string;
    destination: string;
    seats: number;
    status: string;
    fare: number;
    createdAt: Date;
  };
}

interface PassengerPool {
  id: string;
  status: string;
  tesla: { id: string; name: string; capacity: number };
  members: PassengerPoolMember[];
}

export function toPassengerPoolView(pool: PassengerPool, passengerId: string) {
  const activeMembers = pool.members.filter(
    (member) =>
      member.ride.status !== "CANCELLED" &&
      member.ride.status !== "COMPLETED",
  );
  const usedSeats = activeMembers.reduce(
    (total, member) => total + member.seats,
    0,
  );
  const ownMember = pool.members.find(
    (member) => member.ride.passengerId === passengerId,
  );

  return {
    id: pool.id,
    status: pool.status,
    tesla: pool.tesla,
    memberCount: activeMembers.length,
    usedSeats,
    availableSeats: Math.max(pool.tesla.capacity - usedSeats, 0),
    myMembership: ownMember
      ? {
          id: ownMember.id,
          seats: ownMember.seats,
          individualFare: ownMember.individualFare,
          ride: {
            id: ownMember.ride.id,
            pickup: ownMember.ride.pickup,
            destination: ownMember.ride.destination,
            seats: ownMember.ride.seats,
            status: ownMember.ride.status,
            fare: ownMember.ride.fare,
            createdAt: ownMember.ride.createdAt,
          },
        }
      : null,
  };
}
