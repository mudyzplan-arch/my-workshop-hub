// M-Pesa STK Push using the Safaricom Daraja API.
// With MPESA_SIMULATE="true" no real request is made, so you can demo without keys.
import prisma from "./prisma";
import { confirmPayment } from "./booking";

const BASE = process.env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
export const isSimulated = () => process.env.MPESA_SIMULATE !== "false";

// "0712345678" -> "254712345678" (Daraja needs this format)
export function formatPhone(input) {
  let d = String(input).replace(/\D/g, "");
  if (d.startsWith("0")) d = "254" + d.slice(1);
  else if (d.startsWith("7") || d.startsWith("1")) d = "254" + d;
  if (!/^254[17]\d{8}$/.test(d)) throw new Error("Enter a valid Safaricom number, e.g. 0712345678");
  return d;
}

// STEP 1: ask Safaricom for a temporary access token using your Consumer Key + Secret
export async function getAccessToken() {
  const key = process.env.MPESA_CONSUMER_KEY;       // TODO: put your Consumer Key in .env
  const secret = process.env.MPESA_CONSUMER_SECRET; // TODO: put your Consumer Secret in .env
  if (!key || !secret) throw new Error("M-Pesa keys missing. Fill MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in .env");
  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: "Basic " + Buffer.from(`${key}:${secret}`).toString("base64") },
  });
  if (!res.ok) throw new Error("Could not get M-Pesa access token");
  return (await res.json()).access_token;
}

// STEP 2: send the prompt to the customer's phone. Returns { checkoutRequestId }
export async function sendSTKPush(phone, amount, accountRef = "Workshop") {
  const msisdn = formatPhone(phone);

  if (isSimulated()) return { checkoutRequestId: "SIM-" + Date.now(), simulated: true };

  const shortcode = process.env.MPESA_SHORTCODE;     // TODO: your Paybill/Till (sandbox: 174379)
  const passkey = process.env.MPESA_PASSKEY;         // TODO: your Lipa Na M-Pesa passkey
  const callbackUrl = process.env.MPESA_CALLBACK_URL; // TODO: public https URL of /api/payments/mpesa/callback
  if (!shortcode || !passkey || !callbackUrl) throw new Error("Fill MPESA_SHORTCODE, MPESA_PASSKEY and MPESA_CALLBACK_URL in .env");

  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14); // YYYYMMDDHHmmss
  const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode, Password: password, Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline", // use "CustomerBuyGoodsOnline" for a Till number
      Amount: Math.round(amount), PartyA: msisdn, PartyB: shortcode, PhoneNumber: msisdn,
      CallBackURL: callbackUrl, AccountReference: accountRef, TransactionDesc: "Workshop booking",
    }),
  });
  const data = await res.json();
  if (data.ResponseCode !== "0") throw new Error(data.errorMessage || data.ResponseDescription || "STK push failed");
  return { checkoutRequestId: data.CheckoutRequestID };
}

// STEP 3: Safaricom calls our callback URL with the result after the customer enters their PIN.
export async function handleCallback(body) {
  const cb = body?.Body?.stkCallback;
  if (!cb) return;
  const payment = await prisma.payment.findFirst({ where: { checkoutRequestId: cb.CheckoutRequestID } });
  if (!payment) return;

  if (cb.ResultCode === 0) { // 0 = paid
    const items = cb.CallbackMetadata?.Item || [];
    const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
    await confirmPayment(payment.id, { mpesaCode: receipt });
  } else { // cancelled, wrong PIN, no money...
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }
}
