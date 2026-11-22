import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const booking = await prisma.booking.findUnique({
    where: { bookingCode: params.code }, include: { workshop: true, payments: true },
  });
  if (!booking || (booking.userId !== session.id && session.role !== "ADMIN"))
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  return NextResponse.json(booking);
}
