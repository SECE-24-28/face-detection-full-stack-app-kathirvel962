// lib/prisma.ts
// Singleton Prisma client — prevents too many DB connections during hot reload.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prismaFD: PrismaClient };

export const prisma =
  globalForPrisma.prismaFD ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaFD = prisma;
