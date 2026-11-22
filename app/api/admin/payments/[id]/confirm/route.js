import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { confirmPayment } from "@/lib/booking";

// Admin manually marks a payment as confirmed (e.g. you saw the M-Pesa SMS on your own phone)
export async function POST(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { code } = await req.json().catch(() => ({}));
  try {
    await confirmPayment(Number(params.id), { mpesaCode: code || "MANUAL" });
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 409 }); }
}
