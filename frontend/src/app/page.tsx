"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getApiError, warmApi } from "@/lib/api";
import { AuthUser, getStoredUser, saveSession } from "@/lib/auth";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = getStoredUser();

    if (user) {
      router.replace(user.role === "DRIVER" ? "/driver" : "/passenger");
      return;
    }

    void warmApi().catch(() => undefined);
  }, [router]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      saveSession(response.data.token, response.data.user);
      router.replace(
        response.data.user.role === "DRIVER" ? "/driver" : "/passenger",
      );
    } catch (loginError) {
      setError(getApiError(loginError, "Login failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071c16] px-5 py-12 text-white">
      <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between gap-16 p-8 sm:p-12">
          <div>
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Dhaka · Shared electric rides
            </div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Move together.
              <span className="block text-emerald-300">Arrive lighter.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/65">
              Match with nearby passengers, share a Tesla, and follow every
              ride from request to arrival.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              ["9", "Dhaka areas"],
              ["3", "Seats per Tesla"],
              ["20৳", "Pool saving"],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-white/15 pl-3">
                <div className="text-xl font-semibold text-amber-200">
                  {value}
                </div>
                <div className="mt-1 text-xs text-white/50">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#f7faf7] p-7 text-[#10231c] sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold text-emerald-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Sign in to your ride
            </h2>
          </div>

          <form className="space-y-5" onSubmit={login}>
            <label className="block text-sm font-medium">
              Email
              <input
                className="mt-2 w-full rounded-xl border border-[#cedbd4] bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Password
              <input
                className="mt-2 w-full rounded-xl border border-[#cedbd4] bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              className="w-full rounded-xl bg-[#0d5c45] px-4 py-3 font-semibold text-white transition hover:bg-[#094936] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Login"}
            </button>
          </form>

          <div className="mt-8 border-t border-[#dbe5df] pt-6">
            <p className="text-sm text-[#668176]">
              New here?{" "}
              <Link className="font-semibold text-emerald-700" href="/register">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
