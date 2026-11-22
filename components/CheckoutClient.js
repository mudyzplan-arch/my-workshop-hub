"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { kes } from "@/lib/format";

export default function CheckoutClient({ code }) {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [tab, setTab] = useState("mpesa");           // "mpesa" or "card"
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [state, setState] = useState("idle");        // idle | waiting | paying | failed
  const [error, setError] = useState("");
  const timer = useRef(null);

  // Load the booking; if already paid, jump to the receipt
  useEffect(() => {
    fetch(`/api/bookings/${code}`).then((r) => r.json()).then((b) => {
      if (b.error) return setError(b.error);
      if (b.paymentStatus === "PAID") return router.replace(`/confirmation/${code}`);
      setBooking(b);
    });
    return () => clearInterval(timer.current);
  }, [code, router]);

  // M-Pesa: send STK push, then check status every 3 seconds (up to ~2 minutes)
  async function payMpesa() {
    setError(""); setState("waiting");
    const res = await fetch("/api/payments/mpesa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingCode: code, phone }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return setState("idle"); }

    let tries = 0;
    timer.current = setInterval(async () => {
      tries++;
      const s = await (await fetch(`/api/payments/status?code=${code}`)).json();
      if (s.status === "SUCCESS") { clearInterval(timer.current); router.push(`/confirmation/${code}`); }
      else if (s.status === "FAILED" || tries > 40) {
        clearInterval(timer.current);
        setError(s.error || "Payment was not completed. Please try again."); setState("idle");
      }
    }, 3000);
  }

  async function payCard(e) {
    e.preventDefault(); setError(""); setState("paying");
    const res = await fetch("/api/payments/card", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingCode: code, card }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return setState("idle"); }
    router.push(`/confirmation/${code}`);
  }

  if (error && !booking) return <p className="p-8 text-center text-red-600">{error}</p>;
  if (!booking) return <p className="p-8 text-center">Loading...</p>;
  const setC = (k) => (e) => setCard({ ...card, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-4 text-2xl font-extrabold">Checkout</h1>

      <div className="card mb-5 p-4">
        <p className="font-bold">{booking.workshop.title}</p>
        <p className="text-sm text-neutral-600">{booking.seats} seat(s) · Booking {booking.bookingCode}</p>
        <p className="mt-2 flex justify-between text-lg font-extrabold"><span>Total</span><span className="text-brand-dark">{kes(booking.totalAmount)}</span></p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button onClick={() => setTab("mpesa")} disabled={state !== "idle"} className={tab === "mpesa" ? "btn-green" : "btn-outline"}>Pay with M-Pesa</button>
        <button onClick={() => setTab("card")} disabled={state !== "idle"} className={tab === "card" ? "btn-black" : "btn-outline"}>Debit / Credit Card</button>
      </div>

      <div className="card p-5">
        {tab === "mpesa" ? (
          state === "waiting" ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
              <p className="font-bold">Waiting for M-Pesa...</p>
              <p className="mt-1 text-sm text-neutral-600">Check your phone and enter your M-Pesa PIN.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Enter M-Pesa Number (e.g. 0712345678)</label>
                <input className="input" inputMode="tel" placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <button onClick={payMpesa} disabled={!phone} className="btn-green w-full">Pay with M-Pesa - Send STK Push</button>
            </div>
          )
        ) : (
          <form onSubmit={payCard} className="space-y-4">
            <div><label className="label">Card Number</label><input className="input" inputMode="numeric" required placeholder="4242 4242 4242 4242" value={card.number} onChange={setC("number")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Expiry</label><input className="input" required placeholder="MM/YY" maxLength={5} value={card.expiry} onChange={setC("expiry")} /></div>
              <div><label className="label">CVV</label><input className="input" inputMode="numeric" required maxLength={4} value={card.cvv} onChange={setC("cvv")} /></div>
            </div>
            <div><label className="label">Name on Card</label><input className="input" required value={card.name} onChange={setC("name")} /></div>
            <button disabled={state === "paying"} className="btn-black w-full">{state === "paying" ? "Processing..." : `Pay ${kes(booking.totalAmount)}`}</button>
          </form>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
