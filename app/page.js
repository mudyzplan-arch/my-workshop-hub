import Link from "next/link";
import prisma from "@/lib/prisma";
import WorkshopCard from "@/components/WorkshopCard";

export const dynamic = "force-dynamic"; // always show fresh seat numbers

const WHY = [
  ["Hands-on learning", "Kids and teens build real robots, sites and AI projects, not just watch slides."],
  ["Small groups", "Limited seats mean every learner gets the instructor's attention."],
  ["Pay your way", "Book in a minute and pay with M-Pesa or a debit/credit card."],
  ["Local instructors", "Taught by Kenyan engineers who know how to make tech fun."],
];

export default async function Home() {
  const upcoming = await prisma.workshop.findMany({ where: { date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 3 });
  return (
    <>
      {/* HERO */}
      <section className="relative bg-ink text-white">
        <img src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1600" alt="Kids building a robot at a workshop"
          className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">Learn to build the future, one workshop at a time.</h1>
          <p className="mt-4 max-w-xl text-lg text-neutral-200">Robotics, coding and AI workshops for kids and teens across Kenya.</p>
          <Link href="/workshops" className="btn-green mt-8 text-lg">Book Your Seat</Link>
        </div>
      </section>

      {/* WHY US */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-8 text-2xl font-bold">Why families pick us</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map(([title, text]) => (
            <div key={title} className="border-l-4 border-brand bg-white p-5">
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* UPCOMING */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Upcoming workshops</h2>
          <Link href="/workshops" className="text-sm font-semibold text-brand-dark">See all</Link>
        </div>
        {upcoming.length === 0 ? <p className="text-neutral-600">New dates are coming soon.</p> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((w) => <WorkshopCard key={w.id} w={w} />)}</div>
        )}
      </section>
    </>
  );
}
