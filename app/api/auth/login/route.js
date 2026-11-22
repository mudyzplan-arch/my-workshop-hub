import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkPassword, createSession } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: String(email || "").toLowerCase().trim() } });
  if (!user || !(await checkPassword(password || "", user.passwordHash)))
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  await createSession(user);
  return NextResponse.json({ ok: true, role: user.role });
}
