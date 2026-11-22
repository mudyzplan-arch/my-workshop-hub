// One shared database connection (avoids opening many connections in dev).
import { PrismaClient } from "@prisma/client";
const g = globalThis;
const prisma = g.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
export default prisma;
