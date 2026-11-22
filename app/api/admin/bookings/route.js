import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { fullName: true, phone: true, email: true } }, workshop: { select: { title: true } }, payments: true },
  });
  return NextResponse.json(bookings);
}
