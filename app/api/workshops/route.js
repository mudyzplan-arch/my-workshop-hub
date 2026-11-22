import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// Clean the data coming from the admin form
function cleanWorkshop(b) {
  return {
    title: String(b.title || "").trim(), description: String(b.description || "").trim(),
    learn: String(b.learn || ""), schedule: String(b.schedule || ""),
    priceKes: parseInt(b.priceKes), date: new Date(b.date), location: String(b.location || "").trim(),
    maxSeats: parseInt(b.maxSeats), imageUrl: String(b.imageUrl || "").trim(), instructor: String(b.instructor || "").trim(),
  };
}

export async function GET() {
  return NextResponse.json(await prisma.workshop.findMany({ orderBy: { date: "asc" } }));
}

export async function POST(req) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const data = cleanWorkshop(await req.json());
  if (!data.title || isNaN(data.priceKes) || isNaN(data.maxSeats) || isNaN(data.date.getTime()))
    return NextResponse.json({ error: "Title, price, date and seats are required" }, { status: 400 });
  return NextResponse.json(await prisma.workshop.create({ data }));
}
