// Card payments. Switch provider with CARD_PROVIDER in .env: "simulate" | "stripe" | "pesapal"
//
// IMPORTANT: in real life never send raw card numbers through your own server.
// Stripe  -> use Stripe Elements / Checkout (card fields are hosted by Stripe)
// Pesapal -> redirect to Pesapal's hosted payment page
// The simulate provider below just accepts the form so you can see the full flow.

export async function processCardPayment({ amount, card, bookingCode, email }) {
  const provider = process.env.CARD_PROVIDER || "simulate";
  if (provider === "stripe") return payWithStripe({ amount, bookingCode, email });
  if (provider === "pesapal") return payWithPesapal({ amount, bookingCode, email });
  return simulateCard({ card });
}

// Demo mode: basic checks, then "approve"
async function simulateCard({ card }) {
  const digits = String(card.number || "").replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return { success: false, message: "Invalid card number" };
  if (!/^\d{2}\/\d{2}$/.test(card.expiry || "")) return { success: false, message: "Expiry must look like 08/27" };
  if (!/^\d{3,4}$/.test(card.cvv || "")) return { success: false, message: "Invalid CVV" };
  if (!card.name?.trim()) return { success: false, message: "Enter the name on the card" };
  return { success: true, reference: "SIM-CARD-" + Date.now() };
}

async function payWithStripe({ amount, bookingCode, email }) {
  const key = process.env.STRIPE_SECRET_KEY; // TODO: put your Stripe secret key in .env
  if (!key) return { success: false, message: "Stripe key missing (STRIPE_SECRET_KEY)" };
  // TODO: npm install stripe, then create a PaymentIntent here:
  //   const stripe = require("stripe")(key);
  //   const intent = await stripe.paymentIntents.create({ amount: amount * 100, currency: "kes",
  //     receipt_email: email, metadata: { bookingCode } });
  //   return { success: true, reference: intent.id };
  return { success: false, message: "Stripe not wired up yet. See TODO in lib/cardPayment.js" };
}

async function payWithPesapal({ amount, bookingCode, email }) {
  const key = process.env.PESAPAL_CONSUMER_KEY;       // TODO: Pesapal consumer key in .env
  const secret = process.env.PESAPAL_CONSUMER_SECRET; // TODO: Pesapal consumer secret in .env
  if (!key || !secret) return { success: false, message: "Pesapal keys missing" };
  // TODO: 1) POST /api/Auth/RequestToken  2) POST /api/Transactions/SubmitOrderRequest
  //       3) redirect the customer to the returned redirect_url  4) confirm via your IPN URL
  return { success: false, message: "Pesapal not wired up yet. See TODO in lib/cardPayment.js" };
}
