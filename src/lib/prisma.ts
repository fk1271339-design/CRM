import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

if (!process.env.DATABASE_URL) {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    try {
      const tmpDbPath = "/tmp/dev.db";
      const sourceDbPath = path.join(process.cwd(), "prisma", "dev.db");
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
      }
      process.env.DATABASE_URL = "file:/tmp/dev.db";
    } catch (err) {
      console.error("Failed to copy db to /tmp:", err);
      process.env.DATABASE_URL = "file:./dev.db";
    }
  } else {
    process.env.DATABASE_URL = "file:./dev.db";
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
