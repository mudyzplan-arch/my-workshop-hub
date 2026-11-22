import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CheckoutClient from "@/components/CheckoutClient";

export default async function Checkout({ params }) {
  if (!(await getSession())) redirect(`/login?next=/checkout/${params.code}`);
  return <CheckoutClient code={params.code} />;
}
