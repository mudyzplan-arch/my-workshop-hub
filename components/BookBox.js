"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { kes } from "@/lib/format";

// Pick number of seats, then create a pending booking and go to checkout
export default function BookBox({ workshopId, price, left }) {
  const router = useRouter();
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function book() {
    setBusy(true); setError("");
    const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workshopId, seats }) });
    const data = await res.json();
    if (res.status === 401) return router.push(`/login?next=/workshops/${workshopId}`); // not logged in
    if (!res.ok) { setError(data.error); setBusy(false); return; }
    router.push(`/checkout/${data.code}`);
  }

  return (
    <div className="space-y-3">
      <label className="label">Seats</label>
      <select className="input" value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
        {Array.from({ length: Math.min(left, 10) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <p className="flex justify-between font-semibold"><span>Total</span><span>{kes(price * seats)}</span></p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={book} disabled={busy} className="btn-green w-full">{busy ? "Please wait..." : "Book Now"}</button>
      <p className="text-center text-xs text-neutral-500">{left} seats left</p>
    </div>
  );
}
