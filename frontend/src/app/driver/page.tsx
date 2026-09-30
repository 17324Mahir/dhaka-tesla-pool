"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getApiError } from "@/lib/api";
import { clearSession, getStoredUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import TeslaCard from "@/components/TeslaCard";
import FareCard from "@/components/FareCard";

interface DriverRide {
  id: string;
  pickup: string;
  destination: string;
  seats: number;
  status: string;
  fare: number;
  tip?: number;
  receipt?: {
    fare: number;
    tip: number;
    total: number;
  };
  passenger?: {
    name: string;
  };
  poolMember?: {
    pool: {
      id: string;
      status: string;
      tesla: {
        name: string;
      };
    };
  };
}

interface TeslaSummary {
  id: string;
  name: string;
  capacity: number;
  isOnline: boolean;
  occupiedSeats: number;
  availableSeats: number;
}

const nextAction: Record<string, { label: string; endpoint: string }> = {
  MATCHED: { label: "Mark arrival", endpoint: "arrival" },
  DRIVER_ARRIVED: { label: "Start trip", endpoint: "start" },
  STARTED: { label: "Complete trip", endpoint: "complete" },
};

export default function DriverDashboard() {
  const router = useRouter();
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [history, setHistory] = useState<DriverRide[]>([]);
  const [tesla, setTesla] = useState<TeslaSummary | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");

  const loadRides = useCallback(async () => {
    try {
      const [ridesResponse, dashboardResponse, historyResponse] = await Promise.all([
        api.get<DriverRide[]>("/driver/rides"),
        api.get<TeslaSummary>("/driver/dashboard"),
        api.get<DriverRide[]>("/driver/history"),
      ]);
      setError("");
      setRides(ridesResponse.data);
      setTesla(dashboardResponse.data);
      setHistory(historyResponse.data);
    } catch (loadError) {
      setError(getApiError(loadError, "Could not load driver rides"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser();

    if (!user || user.role !== "DRIVER") {
      router.replace("/login");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadRides();
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadRides();
    }, 5_000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [loadRides, router]);

  async function updateRide(ride: DriverRide) {
    const action = nextAction[ride.status];

    if (!action) {
      return;
    }

    setError("");
    setMessage("");
    setPendingId(ride.id);

    try {
      await api.patch(`/driver/ride/${ride.id}/${action.endpoint}`);
      setMessage(`${ride.pickup} → ${ride.destination}: ${action.label} complete`);
      await loadRides();
    } catch (updateError) {
      setError(getApiError(updateError, "Could not update the ride"));
    } finally {
      setPendingId("");
    }
  }

  async function acceptPool(ride: DriverRide) {
    const pool = ride.poolMember?.pool;

    if (!pool) {
      setError("This ride is not assigned to a pool");
      return;
    }

    setError("");
    setMessage("");
    setPendingId(pool.id);

    try {
      const response = await api.patch<{ message: string }>(
        `/driver/pool/${pool.id}/accept`,
      );
      setMessage(response.data.message);
      await loadRides();
    } catch (acceptError) {
      setError(getApiError(acceptError, "Could not accept the pool"));
    } finally {
      setPendingId("");
    }
  }

  async function toggleStatus() {
    if (!tesla) return;

    setError("");
    setMessage("");
    setPendingId("tesla-status");

    try {
      const response = await api.patch<{ message: string }>("/driver/status", {
        isOnline: !tesla.isOnline,
      });
      setMessage(response.data.message);
      await loadRides();
    } catch (statusError) {
      setError(getApiError(statusError, "Could not update driver status"));
    } finally {
      setPendingId("");
    }
  }

  async function cancelRide(ride: DriverRide) {
    setError("");
    setMessage("");
    setPendingId(ride.id);

    try {
      const response = await api.patch<{ message: string }>(
        `/driver/ride/${ride.id}/cancel`,
      );
      setMessage(response.data.message);
      await loadRides();
    } catch (cancelError) {
      setError(getApiError(cancelError, "Could not cancel the ride"));
    } finally {
      setPendingId("");
    }
  }

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#071c16] text-white">
      <Navbar title="Driver dashboard" onLogout={logout} dark />

      <div className="mx-auto max-w-6xl px-5 py-8">
        {tesla ? (
          <TeslaCard
            name={tesla.name}
            capacity={tesla.capacity}
            availableSeats={tesla.availableSeats}
            isOnline={tesla.isOnline}
            pending={pendingId === "tesla-status"}
            onToggle={() => void toggleStatus()}
          />
        ) : (
          <section className="rounded-3xl bg-white/5 p-7 text-white/60">Loading assigned Tesla…</section>
        )}

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
            <span className="text-sm text-white/50">
              {rides.length} {rides.length === 1 ? "ride" : "rides"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <p className="text-sm text-white/55">Loading ride requests…</p>
            ) : rides.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/55">
                {tesla && !tesla.isOnline
                  ? "Go online to receive passenger requests."
                  : "No assigned ride requests yet. New matches appear automatically."}
              </p>
            ) : rides.map((ride) => {
              const action = nextAction[ride.status];
              const pool = ride.poolMember?.pool;
              const isWaitingForAcceptance = pool?.status === "WAITING";

              return (
                <article key={ride.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{ride.pickup} → {ride.destination}</p>
                      <p className="mt-2 text-sm text-white/55">{ride.passenger?.name ?? "Passenger"} · {ride.seats} seat{ride.seats > 1 ? "s" : ""} · {pool?.tesla.name ?? "Tesla"}</p>
                    </div>
                    <StatusBadge status={ride.status} />
                  </div>
                  {isWaitingForAcceptance && pool ? (
                    <button
                      className="mt-6 w-full rounded-xl bg-amber-200 px-4 py-3 text-sm font-semibold text-[#4b3511] hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(pendingId)}
                      onClick={() => void acceptPool(ride)}
                    >
                      {pendingId === pool.id ? "Accepting…" : "Accept pool"}
                    </button>
                  ) : action ? (
                    <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
                      <button
                        className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#083c2d] hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={Boolean(pendingId)}
                        onClick={() => void updateRide(ride)}
                      >
                        {pendingId === ride.id ? "Updating…" : action.label}
                      </button>
                      {ride.status === "MATCHED" && (
                        <button
                          className="rounded-xl border border-red-300/30 px-4 py-3 text-sm font-semibold text-red-200 disabled:opacity-60"
                          disabled={Boolean(pendingId)}
                          onClick={() => void cancelRide(ride)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10 border-t border-white/10 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Trip history</p>
              <h2 className="mt-2 text-2xl font-semibold">Completed rides and earnings</h2>
            </div>
            <p className="text-sm text-white/60">
              Total earned{" "}
              <FareCard
                fare={history.reduce((total, ride) => total + (ride.receipt?.total ?? 0), 0)}
              />
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {history.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/55">
                Completed rides will appear here with fare and tip details.
              </p>
            ) : history.map((ride) => (
              <article key={ride.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{ride.pickup} → {ride.destination}</p>
                    <p className="mt-1 text-sm text-white/55">
                      {ride.passenger?.name ?? "Passenger"} · {ride.seats} seat{ride.seats > 1 ? "s" : ""}
                    </p>
                  </div>
                  <StatusBadge status={ride.status} />
                </div>
                {ride.receipt && (
                  <p className="mt-4 text-sm text-white/70">
                    Fare <FareCard fare={ride.receipt.fare} /> · Tip{" "}
                    <FareCard fare={ride.receipt.tip} /> · Earned{" "}
                    <FareCard fare={ride.receipt.total} />
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
