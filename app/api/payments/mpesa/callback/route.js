import { NextResponse } from "next/server";
import { handleCallback } from "@/lib/mpesa";

// Safaricom POSTs the payment result here. Make this URL public (ngrok/Vercel) and put it in MPESA_CALLBACK_URL.
export async function POST(req) {
  try { await handleCallback(await req.json()); } catch (e) { console.error("M-Pesa callback error", e); }
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }); // Safaricom expects this reply
}
