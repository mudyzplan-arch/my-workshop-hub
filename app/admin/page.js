import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminPanel from "@/components/AdminPanel";

export default async function Admin() {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "ADMIN") redirect("/");
  return <AdminPanel />;
}
