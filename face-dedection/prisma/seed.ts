// prisma/seed.ts
// Creates the default admin user.
// Run: npx ts-node --skip-project prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email    = "admin@example.com";
  const password = "admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { console.log("Admin already exists."); return; }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, password: hashed } });

  console.log("✅ Admin created — email: admin@example.com  password: admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
