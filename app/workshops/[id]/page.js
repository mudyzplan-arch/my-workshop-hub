import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { kes, fmtDate, seatsLeft } from "@/lib/format";
import BookBox from "@/components/BookBox";

export const dynamic = "force-dynamic";
const lines = (t) => t.split("\n").map((s) => s.trim()).filter(Boolean);

export default async function WorkshopDetail({ params }) {
  const w = await prisma.workshop.findUnique({ where: { id: Number(params.id) || 0 } });
  if (!w) notFound();
  const left = seatsLeft(w);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <img src={w.imageUrl} alt={w.title} className="h-56 w-full rounded-xl object-cover sm:h-80" />
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div>
            <h1 className="text-3xl font-extrabold">{w.title}</h1>
            <p className="mt-2 text-neutral-600">{fmtDate(w.date)} · 📍 {w.location}</p>
            <p className="mt-4 text-neutral-800">{w.description}</p>
          </div>
          {lines(w.learn).length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">What you will learn</h2>
              <ul className="space-y-2">{lines(w.learn).map((l) => <li key={l} className="flex gap-2"><span className="text-brand">✔</span>{l}</li>)}</ul>
            </section>
          )}
          <section>
            <h2 className="mb-3 text-xl font-bold">Instructor</h2>
            <p>{w.instructor}</p>
          </section>
          {lines(w.schedule).length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Schedule</h2>
              <ul className="divide-y rounded-xl border bg-white">{lines(w.schedule).map((l) => <li key={l} className="px-4 py-3">{l}</li>)}</ul>
            </section>
          )}
        </div>

        {/* Booking box */}
        <aside className="card h-fit p-5 lg:sticky lg:top-20">
          <p className="text-3xl font-extrabold text-brand-dark">{kes(w.priceKes)}</p>
          <p className="mb-4 text-sm text-neutral-600">per seat</p>
          {left > 0
            ? <BookBox workshopId={w.id} price={w.priceKes} left={left} />
            : <p className="rounded-lg bg-red-50 p-3 text-center font-bold text-red-700">Sold Out</p>}
        </aside>
      </div>
    </div>
  );
}
