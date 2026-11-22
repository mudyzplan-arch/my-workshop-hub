// Small helpers so money and dates look the same everywhere.
export const kes = (n) => "KES " + Number(n).toLocaleString("en-KE");
export const fmtDate = (d) =>
  new Date(d).toLocaleString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const seatsLeft = (w) => w.maxSeats - w.seatsBooked;
