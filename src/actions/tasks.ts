"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { authorize, buildOwnershipFilter } from "@/lib/permissions";
import { taskSchema, type TaskInput } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

const assertUser = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

export async function getTasks() {
  await assertUser();

  return prisma.task.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      assignedUser: { select: { id: true, name: true, avatar: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, name: true } },
    },
  });
}

export async function createTask(data: TaskInput) {
  const user = await assertUser();

  authorize(user, "manage_tasks");

  const validated = taskSchema.parse(data);

  const task = await prisma.task.create({
    data: {
      title: validated.title,
      description: validated.description || null,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      priority: validated.priority ?? "MEDIUM",
      status: validated.status ?? "PENDING",
      assignedUserId: validated.assignedUserId || user.id,
      leadId: validated.leadId || null,
      contactId: validated.contactId || null,
      dealId: validated.dealId || null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      message: `Task created: ${validated.title}`,
      link: "/tasks",
    },
  });

  revalidatePath("/tasks");
  return { success: true, task };
}

export async function updateTaskStatus(id: string, status: string) {
  const user = await assertUser();

  const level = authorize(user, "manage_tasks");
  const ownershipFilter = buildOwnershipFilter(level, user.id);

  const result = await prisma.task.updateMany({
    where: { id, ...ownershipFilter },
    data: { status: status as Prisma.TaskUpdateInput["status"] },
  });

  if (result.count === 0) {
    throw new Error("Task not found or you don't have permission to update it");
  }

  const updated = await prisma.task.findUniqueOrThrow({ where: { id } });

  await prisma.notification.create({
    data: {
      userId: updated.assignedUserId || user.id,
      message: `Task "${updated.title}" marked ${status}`,
      link: "/tasks",
    },
  });

  revalidatePath("/tasks");
  return { success: true, task: updated };
}