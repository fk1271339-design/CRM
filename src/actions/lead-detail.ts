"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { authorize, buildOwnershipFilter, can, type PermissionLevel } from "@/lib/permissions";
import {
  convertLeadSchema,
  leadActivitySchema,
  type ConvertLeadInput,
  type LeadActivityInput,
} from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

const assertUser = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

function leadWhere(level: PermissionLevel, userId: string) {
  return buildOwnershipFilter(level, userId);
}

/** Full lead record with activity timeline, notes, tasks and linked deals. */
export async function getLeadDetail(id: string) {
  const user = await assertUser();
  const level = authorize(user, "view_all_leads");
  const ownershipFilter = leadWhere(level, user.id);

  const lead = await prisma.lead.findFirst({
    where: { id, ...ownershipFilter },
    include: {
      assignedUser: { select: { id: true, name: true, email: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: { assignedUser: { select: { id: true, name: true } } },
      },
      deals: {
        orderBy: { createdAt: "desc" },
        include: {
          contact: { select: { id: true, name: true, email: true } },
          assignedUser: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!lead) {
    throw new Error("Lead not found or you don't have permission to view it");
  }

  return lead;
}

/**
 * TRUE conversion: creates/links Company + Contact + Deal in one shot and
 * marks the lead as CONVERTED. Fully permission-guarded server-side.
 */
export async function convertLead(id: string, data: ConvertLeadInput) {
  const user = await assertUser();
  const level = authorize(user, "view_all_leads");
  const ownershipFilter = leadWhere(level, user.id);

  const existing = await prisma.lead.findFirst({
    where: { id, ...ownershipFilter },
    include: { deals: { select: { id: true } } },
  });
  if (!existing) {
    throw new Error("Lead not found or you don't have permission to convert it");
  }
  if (existing.status === "CONVERTED" || existing.deals.length > 0) {
    throw new Error("This lead has already been converted.");
  }

  const validated = convertLeadSchema.parse(data);

  const fullName = `${existing.firstName} ${existing.lastName}`;

  // ── Company (find-or-create by name) ─────────────────────────────────────
  const existingCompany = await prisma.company.findFirst({
    where: { name: validated.companyName },
    select: { id: true },
  });
  const company = existingCompany
    ? { id: existingCompany.id }
    : await prisma.company.create({
        data: {
          name: validated.companyName,
          website: validated.companyWebsite || null,
          industry: validated.industry || null,
          email: existing.email || null,
          phone: existing.phone || null,
          ownerId: existing.assignedUserId || null,
        },
        select: { id: true },
      });

  // ── Contact (find-or-create by email / name) ─────────────────────────────
  const existingContact = await prisma.contact.findFirst({
    where: {
      OR: [
        { email: existing.email || "no-email" },
        { name: fullName },
      ],
    },
    select: { id: true },
  });
  const contact = existingContact
    ? { id: existingContact.id }
    : await prisma.contact.create({
        data: {
          name: fullName,
          email: existing.email || null,
          phone: existing.phone || null,
          jobTitle: existing.jobTitle || null,
          companyId: company.id,
          ownerId: existing.assignedUserId || null,
          source: existing.source,
        },
        select: { id: true },
      });

  // ── Deal linked to lead + company + contact ──────────────────────────────
  const deal = await prisma.deal.create({
    data: {
      name: validated.dealName,
      leadId: existing.id,
      companyId: company.id,
      contactId: contact.id,
      value: validated.dealValue,
      probability: validated.probability,
      stage: "NEW",
      expectedCloseDate: validated.expectedCloseDate
        ? new Date(validated.expectedCloseDate)
        : null,
      assignedUserId: existing.assignedUserId || user.id,
      source: existing.source,
    },
  });

  // ── Lead → CONVERTED ─────────────────────────────────────────────────────
  await prisma.lead.update({
    where: { id },
    data: { status: "CONVERTED", nextFollowUpAt: null },
  });

  await prisma.activity.createMany({
    data: [
      {
        type: "STATUS_CHANGE",
        title: "Lead Converted",
        description: `Lead converted to Contact, Company "${validated.companyName}" and Deal "${validated.dealName}".`,
        userId: user.id,
        leadId: id,
        dealId: deal.id,
        contactId: contact.id,
      },
      {
        type: "STATUS_CHANGE",
        title: "Deal Created",
        description: `New deal "${validated.dealName}" created from converted lead with value ₹${validated.dealValue}.`,
        userId: user.id,
        leadId: id,
        dealId: deal.id,
      },
    ],
  });

  const dealOwnerId = existing.assignedUserId || user.id;
  await prisma.task.create({
    data: {
      title: `Onboard ${fullName}`,
      description: `Deal "${validated.dealName}" created from lead. Start onboarding for ${validated.companyName}.`,
      priority: "HIGH",
      status: "PENDING",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      assignedUserId: dealOwnerId,
      leadId: id,
      dealId: deal.id,
      contactId: contact.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: dealOwnerId,
      message: `${fullName} converted — deal "${validated.dealName}" created.`,
      link: `/leads/${id}`,
    },
  });

  const leaders = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SALES_MANAGER"] }, id: { not: dealOwnerId } },
    select: { id: true },
  });
  if (leaders.length > 0) {
    await prisma.notification.createMany({
      data: leaders.map((l) => ({
        userId: l.id,
        message: `${fullName} (${validated.companyName}) converted at ₹${validated.dealValue}.`,
        link: `/leads/${id}`,
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "CONVERT_LEAD",
      entityType: "lead",
      entityId: id,
      metadata: JSON.stringify({
        dealId: deal.id,
        companyId: company.id,
        contactId: contact.id,
        dealName: validated.dealName,
        dealValue: validated.dealValue,
      }),
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/deals");
  revalidatePath("/dashboard");

  return { success: true, leadId: id, dealId: deal.id };
}

/** Add an internal note to a lead's timeline. */
export async function addLeadNote(id: string, content: string) {
  const user = await assertUser();
  const level = authorize(user, "view_all_leads");
  const ownershipFilter = leadWhere(level, user.id);

  const lead = await prisma.lead.findFirst({
    where: { id, ...ownershipFilter },
    select: { id: true },
  });
  if (!lead) {
    throw new Error("Lead not found or you don't have permission to update it");
  }

  await prisma.note.create({
    data: { content: content.trim(), userId: user.id, leadId: id },
  });

  revalidatePath(`/leads/${id}`);
  return { success: true };
}

/** Log a sales activity (call / email / meeting / whatsapp) on a lead. */
export async function logLeadActivity(id: string, data: LeadActivityInput) {
  const user = await assertUser();
  const level = authorize(user, "view_all_leads");
  const ownershipFilter = leadWhere(level, user.id);

  const lead = await prisma.lead.findFirst({
    where: { id, ...ownershipFilter },
    select: { firstName: true, lastName: true, assignedUserId: true },
  });
  if (!lead) {
    throw new Error("Lead not found or you don't have permission to update it");
  }

  const validated = leadActivitySchema.parse(data);

  let description = validated.description || validated.title;
  if (validated.nextAction) {
    description += `  Next step: ${validated.nextAction}.`;
  }

  await prisma.activity.create({
    data: {
      type: validated.type,
      title: validated.title,
      description,
      userId: user.id,
      leadId: id,
    },
  });

  await prisma.lead.update({
    where: { id },
    data: {
      lastContactedAt: new Date(),
      nextFollowUpAt: validated.nextFollowUpAt
        ? new Date(validated.nextFollowUpAt)
        : undefined,
    },
  });

  if (validated.nextAction && validated.nextFollowUpAt) {
    await prisma.task.create({
      data: {
        title: `Follow-up: ${validated.nextAction}`,
        description: `${lead.firstName} ${lead.lastName} — ${description}`.slice(0, 1000),
        priority: "MEDIUM",
        status: "PENDING",
        dueDate: new Date(validated.nextFollowUpAt),
        assignedUserId: lead.assignedUserId || user.id,
        leadId: id,
      },
    });
  }

  revalidatePath(`/leads/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

/** Update the lead assignee + next follow-up date. */
export async function updateLeadAssignment(
  id: string,
  data: { assignedUserId?: string; nextFollowUpAt?: Date | string | null }
) {
  const user = await assertUser();
  authorize(user, "assign_lead");

  const lead = await prisma.lead.findFirst({
    where: { id },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!lead) throw new Error("Lead not found");

  await prisma.lead.update({
    where: { id },
    data: {
      assignedUserId: data.assignedUserId || null,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
    },
  });

  if (data.assignedUserId) {
    await prisma.notification.create({
      data: {
        userId: data.assignedUserId,
        message: `Lead ${lead.firstName} ${lead.lastName} assigned to you.`,
        link: `/leads/${id}`,
      },
    });
  }

  revalidatePath(`/leads/${id}`);
  return { success: true };
}

/** Users eligible for assignment (sales roles + manager). */
export async function getAssignableUsers() {
  const user = await assertUser();
  const level = can(user, "assign_lead");
  if (!level) return [];

  return prisma.user.findMany({
    where: { isActive: true, role: { in: ["SALESPERSON", "SALES_MANAGER"] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}