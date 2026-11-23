import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const secret = process.env.JWT_SECRET || "dev-secret-change-me";

export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash);

export async function createSession(user) {
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.fullName },
    secret,
    { expiresIn: "7d" }
  );
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

export const destroySession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("session");
};

export async function requireAdmin() {
  const s = await getSession();
  return s?.role === "ADMIN" ? s : null;
}
