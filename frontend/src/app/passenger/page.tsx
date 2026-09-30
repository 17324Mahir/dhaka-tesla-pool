"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getApiError } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import PoolCard from "@/components/PoolCard";
import RideCard from "@/components/RideCard";

const areas = [
  "Banani",
  "Gulshan",
  "Mohakhali",
  "Dhanmondi",
  "Mirpur",
  "Uttara",
  "Farmgate",
  "Bashundhara",
];

interface Ride {
  id: string;
  pickup: string;
  destination: string;
  seats: number;
  status: string;
  fare: number;
  createdAt: string;
  poolMember?: {
    pool: {
      tesla: { driver: { name: string } };
    };
  } | null;
}

interface Pool {
  id: string;
  status: string;
  tesla: {
    name: string;
    capacity: number;
  };
  memberCount: number;
  usedSeats: number;
  availableSeats: number;
  myMembership: {
    id: string;
    seats: number;
    individualFare: number;
    ride: Ride;
  } | null;
}

export default function PassengerDashboard() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [pickup, setPickup] = useState("Banani");
  const [destination, setDestination] = useState("Mohakhali");
  const [seats, setSeats] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const [ridesResponse, poolsResponse] = await Promise.all([
        api.get<Ride[]>("/rides/history"),
        api.get<Pool[]>("/pool/my"),
      ]);

      setError("");
      setRides(ridesResponse.data);
      setPools(poolsResponse.data);
    } catch (loadError) {
      setError(getApiError(loadError, "Could not load your rides"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser();

    if (!user || user.role !== "PASSENGER") {
      router.replace("/login");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard, router]);

  async function requestRide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await api.post<{ message: string }>("/rides", {
        pickup,
        destination,
        seats,
      });

      setMessage(response.data.message);
      await loadDashboard();
    } catch (requestError) {
      setError(getApiError(requestError, "Ride request failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelRide(rideId: string) {
    setError("");
    setMessage("");

    try {
      const response = await api.patch<{ message: string }>(
        `/rides/${rideId}/cancel`,
      );
      setMessage(response.data.message);
      await loadDashboard();
    } catch (cancelError) {
      setError(getApiError(cancelError, "Cancellation failed"));
    }
  }

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#f2f6f3] text-[#10231c]">
      <Navbar title="Passenger dashboard" onLogout={logout} />

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="h-fit rounded-3xl bg-[#0c3f31] p-6 text-white shadow-xl shadow-emerald-950/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            New request
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Where are you going?</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            We will match you with passengers leaving from the same area.
          </p>

          <form className="mt-7 space-y-4" onSubmit={requestRide}>
            <label className="block text-sm text-white/75">
              Pickup
              <select className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-emerald-300" value={pickup} onChange={(event) => setPickup(event.target.value)}>
                {areas.map((area) => <option className="text-black" key={area}>{area}</option>)}
              </select>
            </label>
            <label className="block text-sm text-white/75">
              Destination
              <select className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-emerald-300" value={destination} onChange={(event) => setDestination(event.target.value)}>
                {areas.map((area) => <option className="text-black" key={area}>{area}</option>)}
              </select>
            </label>
            <label className="block text-sm text-white/75">
              Seats
              <select className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-emerald-300" value={seats} onChange={(event) => setSeats(Number(event.target.value))}>
                {[1, 2, 3].map((count) => <option className="text-black" key={count}>{count}</option>)}
              </select>
            </label>
            <button className="w-full rounded-xl bg-emerald-300 px-4 py-3 font-semibold text-[#093b2d] transition hover:bg-emerald-200 disabled:opacity-60" disabled={isSubmitting}>
              {isSubmitting ? "Matching your ride…" : "Request ride"}
            </button>
          </form>
        </section>

        <div className="space-y-6">
          {(message || error) && (
            <div className={`rounded-2xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"}>
              {error || message}
            </div>
          )}

          <section className="rounded-3xl border border-[#dce6e0] bg-white p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Your pool</p>
                <h2 className="mt-2 text-2xl font-semibold">Shared Tesla</h2>
              </div>
              <span className="text-sm text-[#6b7f76]">{pools.length} active</span>
            </div>

            <div className="mt-5 space-y-4">
              {pools.length === 0 ? (
                <p className="rounded-2xl bg-[#f4f7f4] p-5 text-sm text-[#62766d]">No active pool yet. Request a ride to get matched.</p>
              ) : pools.map((pool) => (
                <PoolCard
                  key={pool.id}
                  teslaName={pool.tesla.name}
                  capacity={pool.tesla.capacity}
                  usedSeats={pool.usedSeats}
                  memberCount={pool.memberCount}
                  status={pool.status}
                  route={pool.myMembership ? `${pool.myMembership.ride.pickup} → ${pool.myMembership.ride.destination}` : undefined}
                  fare={pool.myMembership?.individualFare}
                />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#dce6e0] bg-white p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Ride history</p>
                <h2 className="mt-2 text-2xl font-semibold">Your requests</h2>
              </div>
              <button className="text-sm font-semibold text-emerald-700" onClick={() => void loadDashboard()}>Refresh</button>
            </div>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <p className="text-sm text-[#6b7f76]">Loading rides…</p>
              ) : rides.length === 0 ? (
                <p className="rounded-2xl bg-[#f4f7f4] p-5 text-sm text-[#62766d]">Your ride history will appear here.</p>
              ) : rides.map((ride) => (
                <RideCard
                  key={ride.id}
                  pickup={ride.pickup}
                  destination={ride.destination}
                  seats={ride.seats}
                  fare={ride.fare}
                  status={ride.status}
                  driver={ride.poolMember?.pool.tesla.driver.name}
                  action={["REQUESTED", "MATCHED"].includes(ride.status) ? (
                    <button className="text-sm font-semibold text-red-600 hover:text-red-800" onClick={() => void cancelRide(ride.id)}>Cancel</button>
                  ) : undefined}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
