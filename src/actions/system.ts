"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function resetSystemData() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.note.deleteMany(),
    prisma.task.deleteMany(),
    prisma.deal.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.company.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.dailyLeadGeneration.deleteMany(),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath("/deals");
  revalidatePath("/contacts");
  revalidatePath("/companies");
  revalidatePath("/tasks");
  revalidatePath("/settings");

  return { success: true };
}
