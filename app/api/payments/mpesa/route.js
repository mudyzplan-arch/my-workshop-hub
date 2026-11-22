import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendSTKPush, formatPhone } from "@/lib/mpesa";

// Customer clicked "Send STK Push"
export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const { bookingCode, phone } = await req.json();

  const booking = await prisma.booking.findUnique({ where: { bookingCode } });
  if (!booking || booking.userId !== session.id) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.paymentStatus === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 409 });

  try {
    const { checkoutRequestId } = await sendSTKPush(phone, booking.totalAmount, booking.bookingCode);
    await prisma.booking.update({ where: { id: booking.id }, data: { paymentMethod: "MPESA" } });
    await prisma.payment.create({
      data: { bookingId: booking.id, method: "MPESA", checkoutRequestId, amount: booking.totalAmount,
        phoneNumber: formatPhone(phone), status: "PENDING" },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
