import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean database
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.note.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.dailyLeadGeneration.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Create Default Admin User
  await prisma.user.create({
    data: {
      name: "Faiz Admin",
      email: "admin@faizdigital.com",
      passwordHash,
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  await prisma.user.create({
    data: {
      name: "Sarah Manager",
      email: "manager@faizdigital.com",
      passwordHash,
      role: "SALES_MANAGER",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  await prisma.user.create({
    data: {
      name: "Alex Sales",
      email: "sales@faizdigital.com",
      passwordHash,
      role: "SALESPERSON",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("✅ Users created. All leads, deals, contacts, companies and amounts reset to zero.");
  console.log("🚀 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
