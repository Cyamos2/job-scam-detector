import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
export default prisma;

process.on("beforeExit", async () => {
  try { await prisma.$disconnect(); } catch {}
});