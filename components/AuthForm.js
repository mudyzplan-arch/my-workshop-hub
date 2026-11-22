"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// One form used for both Login and Register
export default function AuthForm({ mode }) {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const isRegister = mode === "register";
  const [f, setF] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setBusy(false); return; }
    router.push(data.role === "ADMIN" ? "/admin" : next); router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-10 max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-extrabold">{isRegister ? "Create your account" : "Log in"}</h1>
      {isRegister && (<>
        <div><label className="label">Full name</label><input className="input" required value={f.fullName} onChange={set("fullName")} /></div>
        <div><label className="label">Phone</label><input className="input" required placeholder="0712345678" value={f.phone} onChange={set("phone")} /></div>
      </>)}
      <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={set("email")} /></div>
      <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={f.password} onChange={set("password")} /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="btn-green w-full">{busy ? "Please wait..." : isRegister ? "Create account" : "Log in"}</button>
      <p className="text-center text-sm text-neutral-600">
        {isRegister ? <>Have an account? <Link className="font-semibold text-brand-dark" href="/login">Log in</Link></>
          : <>New here? <Link className="font-semibold text-brand-dark" href="/register">Create an account</Link></>}
      </p>
    </form>
  );
}
