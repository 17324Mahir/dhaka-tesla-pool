"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import api, { getApiError } from "@/lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PASSENGER" | "DRIVER">("PASSENGER");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");

    try {
      await api.post("/auth/register", { name, email, password, role });
      setMessage("Account created. You can now sign in.");
    } catch (registerError) {
      setError(getApiError(registerError, "Registration failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071c16] px-5 py-12 text-[#10231c]">
      <section className="w-full max-w-lg rounded-[2rem] bg-[#f7faf7] p-8 shadow-2xl sm:p-10">
        <p className="text-sm font-semibold text-emerald-700">Dhaka Tesla Pool</p>
        <h1 className="mt-2 text-3xl font-semibold">Create an account</h1>
        <form className="mt-8 space-y-4" onSubmit={register}>
          <label className="block text-sm font-medium">Name<input className="mt-2 w-full rounded-xl border border-[#cedbd4] bg-white px-4 py-3" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required /></label>
          <label className="block text-sm font-medium">Email<input className="mt-2 w-full rounded-xl border border-[#cedbd4] bg-white px-4 py-3" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="block text-sm font-medium">Password<input className="mt-2 w-full rounded-xl border border-[#cedbd4] bg-white px-4 py-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>
          <label className="block text-sm font-medium">Role<select className="mt-2 w-full rounded-xl border border-[#cedbd4] bg-white px-4 py-3" value={role} onChange={(event) => setRole(event.target.value as "PASSENGER" | "DRIVER")}><option value="PASSENGER">Passenger</option><option value="DRIVER">Driver</option></select></label>
          {(message || error) && <p role={error ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{error || message}</p>}
          <button className="w-full rounded-xl bg-[#0d5c45] px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={pending}>{pending ? "Creating account…" : "Register"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-[#668176]">Already registered? <Link className="font-semibold text-emerald-700" href="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
