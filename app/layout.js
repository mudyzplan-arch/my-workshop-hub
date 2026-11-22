import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = { title: "My Workshop Hub", description: "Hands-on tech workshops in Kenya. Book your seat and pay with M-Pesa or card." };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <Navbar />
        <main>{children}</main>
        <footer className="mt-16 bg-ink py-8 text-center text-sm text-neutral-400">
          © {new Date().getFullYear()} My Workshop Hub · Nairobi, Kenya
        </footer>
      </body>
    </html>
  );
}
