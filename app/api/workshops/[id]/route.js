import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function clean(b) {
  return {
    title: String(b.title || "").trim(), description: String(b.description || "").trim(),
    learn: String(b.learn || ""), schedule: String(b.schedule || ""),
    priceKes: parseInt(b.priceKes), date: new Date(b.date), location: String(b.location || "").trim(),
    maxSeats: parseInt(b.maxSeats), imageUrl: String(b.imageUrl || "").trim(), instructor: String(b.instructor || "").trim(),
  };
}

export async function PUT(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const data = clean(await req.json());
  return NextResponse.json(await prisma.workshop.update({ where: { id: Number(params.id) }, data }));
}

export async function DELETE(_req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const id = Number(params.id);
  if (await prisma.booking.count({ where: { workshopId: id } }))
    return NextResponse.json({ error: "This workshop has bookings, so it can't be deleted." }, { status: 409 });
  await prisma.workshop.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
