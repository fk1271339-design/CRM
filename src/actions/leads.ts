"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { authorize, buildOwnershipFilter } from "@/lib/permissions";
import { leadSchema, type LeadInput } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

const assertUser = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

export async function getLeads(query?: string, statusFilter?: string) {
  const user = await assertUser();

  const level = authorize(user, "view_all_leads");
  const ownershipFilter = buildOwnershipFilter(level, user.id);

  const whereClause: Prisma.LeadWhereInput = {
    ...ownershipFilter,
  };

  if (statusFilter && statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }

  if (query) {
    whereClause.OR = [
      { firstName: { contains: query } },
      { lastName: { contains: query } },
      { email: { contains: query } },
      { companyName: { contains: query } },
    ];
  }

  return prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      assignedUser: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });
}

export async function createLead(data: LeadInput) {
  const user = await assertUser();

  authorize(user, "create_lead");

  const validated = leadSchema.parse(data);

  // Check duplicate lead by email if provided
  if (validated.email) {
    const existing = await prisma.lead.findFirst({
      where: { email: validated.email },
    });
    if (existing) {
      throw new Error(`A lead with email ${validated.email} already exists.`);
    }
  }

  const lead = await prisma.lead.create({
    data: {
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email || null,
      phone: validated.phone || null,
      companyName: validated.companyName || null,
      jobTitle: validated.jobTitle || null,
      description: validated.description || null,
      source: validated.source,
      status: validated.status ?? "NEW",
      priority: validated.priority ?? "MEDIUM",
      estimatedValue: validated.estimatedValue ?? null,
      assignedUserId: validated.assignedUserId || user.id,
      nextFollowUpAt: validated.nextFollowUpAt
        ? new Date(validated.nextFollowUpAt)
        : null,
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      title: "Lead Created",
      description: `Lead created from source: ${validated.source}`,
      userId: user.id,
      leadId: lead.id,
    },
  });

  // Notify the assigned user
  await prisma.notification.create({
    data: {
      userId: lead.assignedUserId || user.id,
      message: `New lead: ${validated.firstName} ${validated.lastName}`,
      link: "/leads",
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, lead };
}

export async function updateLeadStatus(id: string, status: string) {
  const user = await assertUser();

  const level = authorize(user, "edit_any_lead");
  const ownershipFilter = buildOwnershipFilter(level, user.id);

  const result = await prisma.lead.updateMany({
    where: { id, ...ownershipFilter },
    data: { status },
  });

  if (result.count === 0) {
    throw new Error("Lead not found or you don't have permission to update it");
  }

  const updated = await prisma.lead.findUniqueOrThrow({ where: { id } });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      title: "Lead Status Updated",
      description: `Status changed to ${status}`,
      userId: user.id,
      leadId: id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: updated.assignedUserId || user.id,
      message: `${updated.firstName} ${updated.lastName} moved to ${status}`,
      link: "/leads",
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, lead: updated };
}

export async function updateLead(id: string, data: LeadInput) {
  const user = await assertUser();

  const level = authorize(user, "edit_any_lead");
  const ownershipFilter = buildOwnershipFilter(level, user.id);

  const validated = leadSchema.parse(data);

  const result = await prisma.lead.updateMany({
    where: { id, ...ownershipFilter },
    data: {
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email || null,
      phone: validated.phone || null,
      companyName: validated.companyName || null,
      jobTitle: validated.jobTitle || null,
      description: validated.description || null,
      source: validated.source,
      status: validated.status ?? "NEW",
      priority: validated.priority ?? "MEDIUM",
      estimatedValue: validated.estimatedValue ?? null,
      nextFollowUpAt: validated.nextFollowUpAt
        ? new Date(validated.nextFollowUpAt)
        : null,
    },
  });

  if (result.count === 0) {
    throw new Error("Lead not found or you don't have permission to update it");
  }

  const updated = await prisma.lead.findUniqueOrThrow({
    where: { id },
    include: {
      assignedUser: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      title: "Lead Updated",
      description: `Lead "${validated.firstName} ${validated.lastName}" updated`,
      userId: user.id,
      leadId: id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: updated.assignedUserId || user.id,
      message: `Lead updated: ${validated.firstName} ${validated.lastName}`,
      link: "/leads",
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, lead: updated };
}

export async function deleteLead(id: string) {
  const user = await assertUser();

  authorize(user, "delete_lead");

  await prisma.lead.delete({
    where: { id },
  });

  revalidatePath("/leads");
  return { success: true };
}