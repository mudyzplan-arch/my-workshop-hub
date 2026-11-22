"use client";
import { useEffect, useState } from "react";
import { kes, fmtDate } from "@/lib/format";

const EMPTY = { title: "", description: "", learn: "", schedule: "", priceKes: "", date: "", location: "", maxSeats: "", imageUrl: "", instructor: "" };
const toInputDate = (d) => new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const json = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export default function AdminPanel() {
  const [tab, setTab] = useState("workshops");
  const [workshops, setWorkshops] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(null);   // null = hidden, object = add/edit form
  const [msg, setMsg] = useState("");

  async function load() {
    setWorkshops(await (await fetch("/api/workshops")).json());
    setBookings(await (await fetch("/api/admin/bookings")).json());
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const res = await fetch(form.id ? `/api/workshops/${form.id}` : "/api/workshops", json(form.id ? "PUT" : "POST", form));
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setForm(null); setMsg("Workshop saved"); load();
  }
  async function remove(w) {
    if (!confirm(`Delete "${w.title}"?`)) return;
    const res = await fetch(`/api/workshops/${w.id}`, { method: "DELETE" });
    const data = await res.json(); setMsg(res.ok ? "Workshop deleted" : data.error); load();
  }
  async function confirmPay(p) {
    const code = prompt("M-Pesa code (optional):") ?? null;
    if (code === null) return;
    const res = await fetch(`/api/admin/payments/${p.id}/confirm`, json("POST", { code }));
    const data = await res.json(); setMsg(res.ok ? "Payment confirmed" : data.error); load();
  }

  const payments = bookings.flatMap((b) => b.payments.map((p) => ({ ...p, booking: b })));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const Tab = ({ id, label }) => <button onClick={() => setTab(id)} className={tab === id ? "btn-green" : "btn-outline"}>{label}</button>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-extrabold">Admin dashboard</h1>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:flex">
        <Tab id="workshops" label="Workshops" /><Tab id="bookings" label={`Bookings (${bookings.length})`} /><Tab id="payments" label={`Payments (${payments.length})`} />
      </div>
      {msg && <p className="mb-4 rounded-lg bg-brand-light p-3 text-sm">{msg}</p>}

      {/* WORKSHOPS */}
      {tab === "workshops" && (<>
        {!form && <button className="btn-black mb-4" onClick={() => setForm(EMPTY)}>+ Add workshop</button>}
        {form && (
          <form onSubmit={save} className="card mb-6 grid gap-3 p-5 sm:grid-cols-2">
            <h2 className="text-lg font-bold sm:col-span-2">{form.id ? "Edit workshop" : "New workshop"}</h2>
            <input className="input" required placeholder="Title" value={form.title} onChange={set("title")} />
            <input className="input" required placeholder="Instructor" value={form.instructor} onChange={set("instructor")} />
            <input className="input" required type="number" placeholder="Price (KES)" value={form.priceKes} onChange={set("priceKes")} />
            <input className="input" required type="number" placeholder="Max seats" value={form.maxSeats} onChange={set("maxSeats")} />
            <input className="input" required type="datetime-local" value={form.date} onChange={set("date")} />
            <input className="input" required placeholder="Location" value={form.location} onChange={set("location")} />
            <input className="input sm:col-span-2" required placeholder="Image URL" value={form.imageUrl} onChange={set("imageUrl")} />
            <textarea className="input sm:col-span-2" required rows={3} placeholder="Description" value={form.description} onChange={set("description")} />
            <textarea className="input" rows={4} placeholder="What you will learn (one per line)" value={form.learn} onChange={set("learn")} />
            <textarea className="input" rows={4} placeholder="Schedule (one per line)" value={form.schedule} onChange={set("schedule")} />
            <div className="flex gap-2 sm:col-span-2"><button className="btn-green">Save workshop</button><button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button></div>
          </form>
        )}
        <div className="space-y-3">
          {workshops.map((w) => (
            <div key={w.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div><p className="font-bold">{w.title}</p><p className="text-sm text-neutral-600">{fmtDate(w.date)} · {w.location} · {kes(w.priceKes)} · {w.seatsBooked}/{w.maxSeats} booked</p></div>
              <div className="flex gap-2">
                <button className="btn-outline px-3 py-2" onClick={() => setForm({ ...w, date: toInputDate(w.date) })}>Edit</button>
                <button className="btn-outline px-3 py-2 text-red-600" onClick={() => remove(w)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* BOOKINGS */}
      {tab === "bookings" && (
        <Table head={["Code", "Customer", "Workshop", "Seats", "Total", "Method", "Status", "Date"]}
          rows={bookings.map((b) => [b.bookingCode, <>{b.user.fullName}<br /><span className="text-xs text-neutral-500">{b.user.phone}</span></>, b.workshop.title, b.seats, kes(b.totalAmount), b.paymentMethod || "-", <Badge s={b.paymentStatus} />, fmtDate(b.createdAt)])} />
      )}

      {/* PAYMENTS */}
      {tab === "payments" && (
        <Table head={["Booking", "Method", "Code / Ref", "Phone", "Amount", "Status", "Action"]}
          rows={payments.map((p) => [p.booking.bookingCode, p.method, p.mpesaCode || p.cardReference || "-", p.phoneNumber || "-", kes(p.amount), <Badge s={p.status} />,
            p.status !== "SUCCESS" ? <button className="btn-green px-3 py-1.5 text-sm" onClick={() => confirmPay(p)}>Mark confirmed</button> : "✔"])} />
      )}
    </div>
  );
}

const Badge = ({ s }) => <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s === "PAID" || s === "SUCCESS" ? "bg-brand-light text-brand-dark" : s === "FAILED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>{s}</span>;

// Scrolls sideways on small screens
function Table({ head, rows }) {
  if (!rows.length) return <p className="text-neutral-600">Nothing here yet.</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-ink text-white"><tr>{head.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
        <tbody className="divide-y">{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
