import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { processCardPayment } from "@/lib/cardPayment";
import { confirmPayment } from "@/lib/booking";

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const { bookingCode, card } = await req.json();

  const booking = await prisma.booking.findUnique({ where: { bookingCode }, include: { user: true } });
  if (!booking || booking.userId !== session.id) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.paymentStatus === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 409 });

  const result = await processCardPayment({ amount: booking.totalAmount, card: card || {}, bookingCode, email: booking.user.email });
  if (!result.success) return NextResponse.json({ error: result.message || "Card declined" }, { status: 402 });

  // Save to payments table (only the provider reference, never the card number)
  await prisma.booking.update({ where: { id: booking.id }, data: { paymentMethod: "CARD" } });
  const payment = await prisma.payment.create({
    data: { bookingId: booking.id, method: "CARD", cardReference: result.reference, amount: booking.totalAmount, status: "PENDING" },
  });
  try { await confirmPayment(payment.id, { cardReference: result.reference }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 409 }); }
  return NextResponse.json({ ok: true });
}
