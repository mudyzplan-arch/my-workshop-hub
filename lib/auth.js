// Email + password login using a signed cookie (JWT). Passwords are hashed with bcrypt.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Log the user in: store a signed token in an httpOnly cookie (JavaScript in the browser cannot read it)
export async function createSession(user) {
  const token = await new SignJWT({ id: user.id, role: user.role, name: user.fullName })
    .setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret());
  cookies().set("session", token, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
}

// Who is logged in? Returns { id, role, name } or null.
export async function getSession() {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload; } catch { return null; }
}

export const destroySession = () => cookies().delete("session");

// Returns the session only if the user is an admin, otherwise null
export async function requireAdmin() {
  const s = await getSession();
  return s?.role === "ADMIN" ? s : null;
}
