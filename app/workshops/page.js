import prisma from "@/lib/prisma";
import WorkshopCard from "@/components/WorkshopCard";

export const dynamic = "force-dynamic";

export default async function Workshops() {
  const list = await prisma.workshop.findMany({ orderBy: { date: "asc" } });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-extrabold">All workshops</h1>
      {list.length === 0 ? <p>No workshops yet. Check back soon.</p> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((w) => <WorkshopCard key={w.id} w={w} />)}</div>
      )}
    </div>
  );
}
