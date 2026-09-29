"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getApiError } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/auth";

interface DriverRide {
  id: string;
  pickup: string;
  destination: string;
  seats: number;
  status: string;
  fare: number;
  passenger?: {
    name: string;
  };
}

const nextAction: Record<string, { label: string; endpoint: string }> = {
  MATCHED: { label: "Mark arrival", endpoint: "arrival" },
  DRIVER_ARRIVED: { label: "Start trip", endpoint: "start" },
  STARTED: { label: "Complete trip", endpoint: "complete" },
};

export default function DriverDashboard() {
  const router = useRouter();
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadRides = useCallback(async () => {
    try {
      const response = await api.get<DriverRide[]>("/driver/rides");
      setError("");
      setRides(response.data);
    } catch (loadError) {
      setError(getApiError(loadError, "Could not load driver rides"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser();

    if (!user || user.role !== "DRIVER") {
      router.replace("/");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadRides();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRides, router]);

  async function updateRide(ride: DriverRide) {
    const action = nextAction[ride.status];

    if (!action) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.patch(`/driver/ride/${ride.id}/${action.endpoint}`);
      setMessage(`${ride.pickup} → ${ride.destination}: ${action.label} complete`);
      await loadRides();
    } catch (updateError) {
      setError(getApiError(updateError, "Could not update the ride"));
    }
  }

  function logout() {
    clearSession();
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-[#071c16] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Dhaka Tesla Pool</p>
            <h1 className="mt-1 text-xl font-semibold">Driver dashboard</h1>
          </div>
          <button className="text-sm font-semibold text-white/60 hover:text-white" onClick={logout}>Log out</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <section className="flex flex-col justify-between gap-6 rounded-3xl bg-emerald-300 p-7 text-[#083c2d] sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Driver workspace</p>
            <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight">Keep every shared ride moving.</h2>
          </div>
          <button className="rounded-xl bg-[#083c2d] px-5 py-3 text-sm font-semibold text-white" onClick={() => void loadRides()}>Refresh requests</button>
        </section>

        {(message || error) && (
          <div className={`mt-6 rounded-2xl px-4 py-3 text-sm ${error ? "bg-red-400/10 text-red-200" : "bg-emerald-300/10 text-emerald-200"}`} role={error ? "alert" : "status"}>
            {error || message}
          </div>
        )}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Assigned work</p>
              <h2 className="mt-2 text-2xl font-semibold">Ride requests</h2>
            </div>
            <span className="text-sm text-white/50">{rides.length} rides</span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <p className="text-sm text-white/55">Loading ride requests…</p>
            ) : rides.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/55">No ride requests are available.</p>
            ) : rides.map((ride) => {
              const action = nextAction[ride.status];

              return (
                <article key={ride.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{ride.pickup} → {ride.destination}</p>
                      <p className="mt-2 text-sm text-white/55">{ride.passenger?.name ?? "Passenger"} · {ride.seats} seat{ride.seats > 1 ? "s" : ""}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200">{ride.status.replaceAll("_", " ")}</span>
                  </div>
                  {action && (
                    <button className="mt-6 w-full rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#083c2d] hover:bg-emerald-200" onClick={() => void updateRide(ride)}>{action.label}</button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
