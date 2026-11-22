import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { kes, fmtDate } from "@/lib/format";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function Confirmation({ params }) {
  const session = await getSession();
  if (!session) redirect(`/login?next=/confirmation/${params.code}`);
  const b = await prisma.booking.findUnique({ where: { bookingCode: params.code }, include: { workshop: true, user: true, payments: true } });
  if (!b || (b.userId !== session.id && session.role !== "ADMIN")) notFound();
  if (b.paymentStatus !== "PAID") redirect(`/checkout/${b.bookingCode}`);
  const pay = b.payments.find((p) => p.status === "SUCCESS");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-5 rounded-xl bg-brand p-6 text-center text-white">
        <p className="text-2xl font-extrabold">Thank you! Your booking is confirmed</p>
        <p className="mt-3 text-sm">Your booking code</p>
        <p className="text-4xl font-black tracking-wider">{b.bookingCode}</p>
      </div>

      <div className="card space-y-2 p-5 text-sm">
        <h2 className="text-lg font-bold">Receipt</h2>
        <Row k="Name" v={b.user.fullName} />
        <Row k="Workshop" v={b.workshop.title} />
        <Row k="Date" v={fmtDate(b.workshop.date)} />
        <Row k="Location" v={b.workshop.location} />
        <Row k="Seats" v={b.seats} />
        <Row k="Payment method" v={b.paymentMethod === "MPESA" ? "M-Pesa" : "Card"} />
        <Row k={b.paymentMethod === "MPESA" ? "M-Pesa code" : "Card reference"} v={pay?.mpesaCode || pay?.cardReference || "-"} />
        <div className="flex justify-between border-t pt-3 text-lg font-extrabold"><span>Total paid</span><span className="text-brand-dark">{kes(b.totalAmount)}</span></div>
      </div>

      <div className="mt-5 flex gap-3 print:hidden">
        <PrintButton />
        <Link href="/workshops" className="btn-green flex-1">More workshops</Link>
      </div>
    </div>
  );
}

const Row = ({ k, v }) => <div className="flex justify-between gap-4"><span className="text-neutral-500">{k}</span><span className="text-right font-medium">{v}</span></div>;
