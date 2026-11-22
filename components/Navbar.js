import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const user = await getSession(); // who is logged in (or null)
  return (
    <header className="sticky top-0 z-20 bg-ink text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">My Workshop <span className="text-brand">Hub</span></Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/workshops" className="hover:text-brand">Workshops</Link>
          {user?.role === "ADMIN" && <Link href="/admin" className="hover:text-brand">Admin</Link>}
          {user ? <LogoutButton /> : <Link href="/login" className="rounded-lg bg-brand px-3 py-1.5 font-semibold">Log in</Link>}
        </div>
      </nav>
    </header>
  );
}
