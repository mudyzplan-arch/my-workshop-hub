import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createUniqueCode } from "@/lib/booking";

// Create a PENDING booking. Seats are only taken once payment succeeds.
export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Please log in first" }, { status: 401 });

  const { workshopId, seats } = await req.json();
  const n = parseInt(seats);
  const workshop = await prisma.workshop.findUnique({ where: { id: Number(workshopId) } });
  if (!workshop) return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
  if (!n || n < 1) return NextResponse.json({ error: "Choose at least 1 seat" }, { status: 400 });
  if (n > workshop.maxSeats - workshop.seatsBooked)
    return NextResponse.json({ error: "Not enough seats left" }, { status: 409 });

  const booking = await prisma.booking.create({
    data: { userId: session.id, workshopId: workshop.id, bookingCode: await createUniqueCode(),
      seats: n, totalAmount: workshop.priceKes * n },
  });
  return NextResponse.json({ code: booking.bookingCode });
}
