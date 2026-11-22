import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { confirmPayment } from "@/lib/booking";
import { isSimulated } from "@/lib/mpesa";

// The checkout page asks this every 3 seconds: "has the customer paid yet?"
export async function GET(req) {
  const session = await getSession();
  const code = new URL(req.url).searchParams.get("code");
  const booking = await prisma.booking.findUnique({ where: { bookingCode: code || "" } });
  if (!session || !booking || booking.userId !== session.id) return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });

  const payment = await prisma.payment.findFirst({ where: { bookingId: booking.id }, orderBy: { id: "desc" } });
  if (!payment) return NextResponse.json({ status: "PENDING" });

  // DEMO: pretend the customer entered their PIN after 6 seconds
  if (isSimulated() && payment.method === "MPESA" && payment.status === "PENDING" && Date.now() - payment.createdAt.getTime() > 6000) {
    try {
      await confirmPayment(payment.id, { mpesaCode: "SIM" + Math.random().toString(36).slice(2, 10).toUpperCase() });
      return NextResponse.json({ status: "SUCCESS" });
    } catch (e) { return NextResponse.json({ status: "FAILED", error: e.message }); }
  }
  return NextResponse.json({ status: payment.status });
}
