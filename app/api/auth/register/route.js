import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req) {
  const { fullName, phone, email, password } = await req.json();
  if (!fullName || !phone || !email || !password || password.length < 6)
    return NextResponse.json({ error: "Fill all fields. Password needs 6+ characters." }, { status: 400 });
  const lower = email.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email: lower } }))
    return NextResponse.json({ error: "That email is already registered. Try logging in." }, { status: 409 });
  const user = await prisma.user.create({
    data: { fullName: fullName.trim(), phone: phone.trim(), email: lower, passwordHash: await hashPassword(password), role: "USER" },
  });
  await createSession(user);
  return NextResponse.json({ ok: true });
}
