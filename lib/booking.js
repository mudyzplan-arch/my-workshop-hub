// Core booking logic shared by M-Pesa, card and admin "mark as paid".
import prisma from "./prisma";

// Makes codes like WSH-1234 and makes sure none is used twice
export async function createUniqueCode() {
  for (let i = 0; i < 20; i++) {
    const code = "WSH-" + Math.floor(1000 + Math.random() * 9000);
    if (!(await prisma.booking.findUnique({ where: { bookingCode: code } }))) return code;
  }
  return "WSH-" + Date.now().toString().slice(-6); // fallback
}

// Called ONLY when money is confirmed. In one safe transaction it:
// 1) checks seats are still available  2) reduces seats  3) marks booking PAID  4) marks payment SUCCESS
export async function confirmPayment(paymentId, { mpesaCode, cardReference } = {}) {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
    if (!payment) throw new Error("Payment not found");
    if (payment.status === "SUCCESS") return payment; // already done, do nothing twice

    const { booking } = payment;
    const workshop = await tx.workshop.findUnique({ where: { id: booking.workshopId } });
    if (workshop.seatsBooked + booking.seats > workshop.maxSeats) {
      await tx.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });
      await tx.booking.update({ where: { id: booking.id }, data: { paymentStatus: "FAILED" } });
      throw new Error("Sold out before payment finished. Please contact us for a refund.");
    }
    await tx.workshop.update({ where: { id: workshop.id }, data: { seatsBooked: { increment: booking.seats } } });
    await tx.booking.update({ where: { id: booking.id }, data: { paymentStatus: "PAID" } });
    return tx.payment.update({
      where: { id: paymentId },
      data: { status: "SUCCESS", mpesaCode: mpesaCode || payment.mpesaCode, cardReference: cardReference || payment.cardReference },
      include: { booking: { include: { user: true } } },
    });
  });
  sendConfirmation(result);
  return result;
}

// TODO (optional): connect a real SMS/WhatsApp/email service here (Africa's Talking, Twilio, Resend...).
function sendConfirmation(payment) {
  const code = payment?.booking?.bookingCode;
  console.log(`[CONFIRMATION] Thank you! Your booking is confirmed. Code: ${code}`);
}
