# My Workshop Hub

Workshop booking site: Next.js + Tailwind + Prisma + PostgreSQL, with M-Pesa and card payments.

## Folder structure
```
my-workshop-hub/
├── schema.sql                 SQL tables (PostgreSQL)
├── .env.example               Copy to .env and fill in
├── prisma/schema.prisma       Same tables for Prisma
├── prisma/seed.js             Admin, demo user, 3 workshops
├── lib/
│   ├── mpesa.js               getAccessToken(), sendSTKPush(), handleCallback()
│   ├── cardPayment.js         processCardPayment()  (simulate / stripe / pesapal)
│   ├── booking.js             booking codes + confirmPayment() (reduces seats)
│   ├── auth.js                email+password login (cookie)
│   └── prisma.js, format.js   helpers
├── components/                Navbar, WorkshopCard, BookBox, CheckoutClient, AdminPanel...
└── app/
    ├── page.js                Homepage
    ├── workshops/             List + detail pages
    ├── checkout/[code]/       Choose M-Pesa or card
    ├── confirmation/[code]/   Booking code + receipt
    ├── admin/                 Admin dashboard
    ├── login/, register/
    └── api/                   Backend routes (auth, workshops, bookings, payments, admin)
```

## 1. Run it (demo mode, no payment keys needed)
1. Install Node.js 18+ and PostgreSQL. Create a database: `createdb workshop_hub`
2. `cd my-workshop-hub && npm install`
3. `cp .env.example .env` then edit `DATABASE_URL` and `JWT_SECRET`
4. Create tables: `npx prisma db push` (or run `psql -d workshop_hub -f schema.sql`)
5. Add sample data: `npm run db:seed`
6. `npm run dev` and open http://localhost:3000

Logins: admin `admin@workshophub.co.ke` / `Admin@123` (change this!), demo `demo@workshophub.co.ke` / `Demo@123`.

No Postgres? In `prisma/schema.prisma` set `provider = "sqlite"` and `DATABASE_URL="file:./dev.db"`, then `npx prisma db push`.

Demo mode: M-Pesa shows "Waiting for M-Pesa..." and auto-succeeds after about 6 seconds. Any valid-looking card works.

## 2. Go live with M-Pesa (Daraja)
1. Create an account at https://developer.safaricom.co.ke and log in.
2. **My Apps > Add a new app**, tick **Lipa Na M-Pesa Sandbox**. Copy the **Consumer Key** and **Consumer Secret** into `.env`.
3. Open **APIs > M-Pesa Express (STK Push) > Simulate**. Sandbox shortcode is `174379` and the sandbox **Passkey** is shown there. Put both in `.env`.
4. The callback must be a public https URL. Locally, run `ngrok http 3000`, then set
   `MPESA_CALLBACK_URL="https://YOUR-NGROK-URL/api/payments/mpesa/callback"`.
5. Set `MPESA_SIMULATE="false"` and restart. Sandbox only accepts test numbers from the Daraja simulator.
6. **Production**: on the Daraja portal click **Go Live**, submit your Paybill/Till and business details, then use the production Consumer Key/Secret, your real shortcode, and the passkey Safaricom emails you. Set `MPESA_ENV="production"`. For a Till number change `TransactionType` to `CustomerBuyGoodsOnline` in `lib/mpesa.js`.

## 3. Go live with cards
**Pesapal (popular in Kenya):** register at https://www.pesapal.com, then in the merchant dashboard get the **Consumer Key** and **Consumer Secret** (sandbox: https://developer.pesapal.com). Register an IPN URL to get an `IPN_ID`. Put these in `.env`, set `CARD_PROVIDER="pesapal"`, and finish the TODO in `lib/cardPayment.js` (Pesapal sends customers to its own secure payment page).

**Stripe:** create an account at https://dashboard.stripe.com, copy the secret key from **Developers > API keys**, set `CARD_PROVIDER="stripe"`, and finish the TODO in `lib/cardPayment.js`. Check that Stripe supports KES for your account country.

Security note: the card form here is for demo/flow. For real payments let Stripe Elements or Pesapal's hosted page collect the card number, so card data never touches your server.

## How the booking flow works
1. User logs in, picks seats on a workshop page, and clicks **Book Now**. A PENDING booking with a code like `WSH-1234` is created.
2. Checkout: M-Pesa STK push or card.
3. When payment succeeds, `confirmPayment()` (lib/booking.js) reduces seats, marks the booking PAID and saves the payment. At 0 seats the workshop shows **Sold Out**.
4. If a payment is stuck, the admin can use **Mark confirmed** in the dashboard.
