import Link from "next/link";
import { kes, fmtDate, seatsLeft } from "@/lib/format";

// One workshop tile, used on the home page and the workshops page
export default function WorkshopCard({ w }) {
  const left = seatsLeft(w);
  return (
    <Link href={`/workshops/${w.id}`} className="card block overflow-hidden transition hover:shadow-md">
      <div className="relative">
        <img src={w.imageUrl} alt={w.title} className="h-44 w-full object-cover" />
        <span className={`absolute right-2 top-2 rounded-full px-3 py-1 text-xs font-bold text-white ${left > 0 ? "bg-brand" : "bg-red-600"}`}>
          {left > 0 ? `${left} seats left` : "Sold Out"}
        </span>
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-lg font-bold">{w.title}</h3>
        <p className="text-sm text-neutral-600">{fmtDate(w.date)}</p>
        <p className="text-sm text-neutral-600">📍 {w.location}</p>
        <p className="pt-1 text-xl font-extrabold text-brand-dark">{kes(w.priceKes)}</p>
      </div>
    </Link>
  );
}
