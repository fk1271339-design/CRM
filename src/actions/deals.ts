"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { authorize, buildOwnershipFilter } from "@/lib/permissions";
import { dealSchema, type DealInput } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

const assertUser = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

/**
 * When a deal is Closed Won/Lost and it is linked to a lead, automatically
 * sync the lead status:
 *   WON  -> lead becomes CONVERTED + onboarding task + notifications
 *   LOST -> lead becomes LOST + activity + notification
 * This is the "no manual work" automation the sales team asked for.
 */
async function applyDealOutcomeToLead(
  deal: {
    id: string;
    name: string;
    stage: string;
    lostReason: string | null;
    assignedUserId: string | null;
    lead: { id: string; firstName: string; lastName: string; companyName: string | null; status: string; assignedUserId: string | null } | null;
  },
  actingUserId: string
) {
  const lead = deal.lead;
  if (!lead) return;

  const ownerId = deal.assignedUserId || lead.assignedUserId || actingUserId;

  if (deal.stage === "WON") {
    if (lead.status !== "CONVERTED") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "CONVERTED" },
      });
    }

    await prisma.activity.create({
      data: {
        type: "STATUS_CHANGE",
        title: "Lead Auto-Converted",
        description: `Deal "${deal.name}" was Closed Won — ${lead.firstName} ${lead.lastName} automatically marked as CONVERTED.`,
        userId: actingUserId,
        leadId: lead.id,
        dealId: deal.id,
      },
    });

    if (ownerId) {
      await prisma.task.create({
        data: {
          title: `Onboard ${lead.firstName} ${lead.lastName}`,
          description: `Deal "${deal.name}" closed won. Start onboarding for ${lead.companyName || "this customer"}.`,
          priority: "HIGH",
          status: "PENDING",
          assignedUserId: ownerId,
          leadId: lead.id,
          dealId: deal.id,
        },
      });
    }
  } else if (deal.stage === "LOST") {
    if (lead.status !== "CONVERTED") {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "LOST" },
      });
    }

    await prisma.activity.create({
      data: {
        type: "STATUS_CHANGE",
        title: "Lead Auto-Marked Lost",
        description: `Deal "${deal.name}" was Closed Lost (${deal.lostReason || "Not specified"}) — ${lead.firstName} ${lead.lastName} automatically marked as LOST.`,
        userId: actingUserId,
        leadId: lead.id,
        dealId: deal.id,
      },
    });
  }

  // Notify owner
  if (ownerId) {
    await prisma.notification.create({
      data: {
        userId: ownerId,
        message:
          deal.stage === "WON"
            ? `Deal "${deal.name}" won! Lead auto-converted.`
            : `Deal "${deal.name}" lost. Lead auto-marked as LOST.`,
        link: "/deals",
      },
    });
  }

  // Notify admins + managers so leadership sees the outcome.
  if (deal.stage === "WON" || deal.stage === "LOST") {
    const leaders = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SALES_MANAGER"] }, id: { not: ownerId || undefined } },
      select: { id: true },
    });
    if (leaders.length > 0) {
      await prisma.notification.createMany({
        data: leaders.map((l) => ({
          userId: l.id,
          message:
            deal.stage === "WON"
              ? `Deal "${deal.name}" was Closed Won.`
              : `Deal "${deal.name}" was Closed Lost (${deal.lostReason || "Not specified"}).`,
          link: "/deals",
        })),
      });
    }
  }
}

export async function getDeals() {
  const user = await assertUser();

  const level = authorize(user, "view_all_deals");
  const ownershipFilter = buildOwnershipFilter(level, user.id);

  return prisma.deal.findMany({
    where: ownershipFilter as Prisma.DealWhereInput,
    orderBy: { updatedAt: "desc" },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true, email: true } },
      assignedUser: { select: { id: true, name: true, avatar: true } },
    },
  });
}

export async function createDeal(data: DealInput, leadId?: string) {
  const user = await assertUser();

  authorize(user, "manage_deals");

  const validated = dealSchema.parse(data);

  const deal = await prisma.deal.create({
    data: {
      name: validated.name,
      leadId: leadId || null,
      companyId: validated.companyId || null,
      contactId: validated.contactId || null,
      value: validated.value,
      probability: validated.probability,
      stage: validated.stage ?? "NEW",
      expectedCloseDate: validated.expectedCloseDate
        ? new Date(validated.expectedCloseDate)
        : null,
      assignedUserId: validated.assignedUserId || user.id,
      source: validated.source || null,
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      title: "Deal Created",
      description: `New deal "${validated.name}" created at stage ${validated.stage} (₹${validated.value})`,
      userId: user.id,
      dealId: deal.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: deal.assignedUserId || user.id,
      message: `New deal created: ${validated.name}`,
      link: "/deals",
    },
  });

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return { success: true, deal };
}

export async function updateDealStage(id: string, stage: string) {
  const user = await assertUser();

  const level = authorize(user, "manage_deals");
  const ownershipFilter = buildOwnershipFilter(level, user.id);

  const existing = await prisma.deal.findFirst({
    where: { id, ...ownershipFilter },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          status: true,
          assignedUserId: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Deal not found or you don't have permission to update it");
  }

  const prevStage = existing.stage;

  const updated = await prisma.deal.update({
    where: { id },
    data: { stage },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      title: "Deal Stage Moved",
      description: `Deal "${updated.name}" moved from ${prevStage} to ${stage}`,
      userId: user.id,
      dealId: id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: updated.assignedUserId || user.id,
      message: `${updated.name} moved to ${stage}`,
      link: "/deals",
    },
  });

  await applyDealOutcomeToLead(
    { ...existing, stage: updated.stage, lostReason: updated.lostReason },
    user.id
  );

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return { success: true, deal: updated };
}

export async function updateDeal(id: string, data: DealInput) {
  const user = await assertUser();

  const level = authorize(user, "manage_deals");
  const ownershipFilter = buildOwnershipFilter(level, user.id);

  const validated = dealSchema.parse(data);

  const existing = await prisma.deal.findFirst({
    where: { id, ...ownershipFilter },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          status: true,
          assignedUserId: true,
        },
      },
    },
  });

  if (!existing) {
    throw new Error("Deal not found or you don't have permission to update it");
  }

  const prevStage = existing.stage;
  const valueChanged = existing.value !== validated.value;

  const updated = await prisma.deal.update({
    where: { id },
    data: {
      name: validated.name,
      leadId: existing.leadId || null,
      companyId: validated.companyId || null,
      contactId: validated.contactId || null,
      value: validated.value,
      probability: validated.probability,
      stage: validated.stage ?? "NEW",
      lostReason: validated.stage === "LOST" ? (validated.lostReason || null) : null,
      expectedCloseDate: validated.expectedCloseDate
        ? new Date(validated.expectedCloseDate)
        : null,
      assignedUserId: validated.assignedUserId || user.id,
      source: validated.source || null,
    },
  });

  if (valueChanged) {
    await prisma.activity.create({
      data: {
        type: "STATUS_CHANGE",
        title: "Deal Value Changed",
        description: `Deal value changed from ₹${existing.value} to ₹${validated.value} for "${validated.name}".`,
        userId: user.id,
        dealId: id,
      },
    });
  }

  if (prevStage !== updated.stage) {
    await prisma.activity.create({
      data: {
        type: "STATUS_CHANGE",
        title: "Deal Stage Moved",
        description: `Deal "${validated.name}" moved from ${prevStage} to ${updated.stage}`,
        userId: user.id,
        dealId: id,
      },
    });
  }

  if (!valueChanged && prevStage === updated.stage) {
    await prisma.activity.create({
      data: {
        type: "STATUS_CHANGE",
        title: "Deal Updated",
        description: `Deal "${validated.name}" updated`,
        userId: user.id,
        dealId: id,
      },
    });
  }

  await applyDealOutcomeToLead(
    { ...existing, stage: updated.stage, lostReason: updated.lostReason },
    user.id
  );

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return { success: true, deal: updated };
}

export async function deleteDeal(id: string) {
  const user = await assertUser();

  authorize(user, "delete_deal");

  await prisma.deal.delete({
    where: { id },
  });

  revalidatePath("/deals");
  return { success: true };
}