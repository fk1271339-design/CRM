"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/permissions";
import { getDailyLeadTemplates, todayDateStr } from "@/lib/lead-pool";
import { revalidatePath } from "next/cache";

const assertUser = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Core daily lead generation engine.
 * Idempotent: if a batch record for the same date exists, nothing new is
 * created — guarantees "5 per calendar day" across refreshes and sessions.
 */
export async function runDailyLeadGeneration(
  today = todayDateStr(),
  source: "AUTOMATIC" | "MANUAL" = "AUTOMATIC"
) {
  const existingBatch = await prisma.dailyLeadGeneration.findUnique({
    where: { date: today },
  });

  if (existingBatch) {
    return {
      alreadyGenerated: true,
      generatedCount: 0,
      count: existingBatch.count,
      message: "Today's 5 leads have already been generated.",
    };
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, role: true },
  });

  const salespeople = users.filter((u) =>
    ["SALESPERSON", "SALES_MANAGER"].includes(u.role)
  );
  const actor =
    users.find((u) => u.role === "ADMIN") ||
    salespeople[0] ||
    users[0];

  if (!actor) {
    await prisma.dailyLeadGeneration.create({
      data: { date: today, count: 0, status: "FAILED", source },
    });
    return {
      alreadyGenerated: false,
      generatedCount: 0,
      count: 0,
      message: "No active users found. Lead generation aborted.",
    };
  }

  // Round-robin assignment: pick the salesperson with the fewest leads first.
  const assignedCounts = await prisma.lead.groupBy({
    by: ["assignedUserId"],
    _count: { id: true },
  });
  const countMap = new Map(
    assignedCounts.map((c) => [c.assignedUserId, c._count.id])
  );
  const queue = [...salespeople].sort(
    (a, b) => (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0)
  );
  let cursor = 0;

  const templates = getDailyLeadTemplates(today, 5);
  const createdIds: string[] = [];
  const skipped: string[] = [];

  for (const t of templates) {
    try {
      // Duplicate protection
      const dup = await prisma.lead.findFirst({
        where: {
          OR: [
            { email: t.email },
            {
              firstName: t.firstName,
              lastName: t.lastName,
              companyName: t.companyName,
            },
          ],
        },
        select: { id: true },
      });
      if (dup) {
        skipped.push(t.email);
        continue;
      }

      const assignee = queue.length > 0 ? queue[cursor % queue.length] : null;
      cursor++;

      const lead = await prisma.lead.create({
        data: {
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          phone: t.phone,
          companyName: t.companyName,
          jobTitle: t.jobTitle,
          description: `Requirement: ${t.requirement}.  Industry: ${t.industry}.  Expected timeline: ${t.timeline}.`,
          source: t.source,
          status: "NEW",
          priority: t.priority,
          estimatedValue: t.estimatedValue,
          assignedUserId: assignee?.id ?? null,
        },
      });

      await prisma.activity.create({
        data: {
          type: "NOTE",
          title: "Lead Created",
          description: `Daily lead generation — ${t.requirement}`,
          userId: actor.id,
          leadId: lead.id,
        },
      });

      if (assignee) {
        await prisma.activity.create({
          data: {
            type: "STATUS_CHANGE",
            title: "Lead Assigned",
            description: `Lead assigned to ${assignee.name} (round-robin).`,
            userId: actor.id,
            leadId: lead.id,
          },
        });
        await prisma.notification.create({
          data: {
            userId: assignee.id,
            message: `New lead assigned to you: ${t.firstName} ${t.lastName} (${t.companyName}) — ${t.source}`,
            link: `/leads/${lead.id}`,
          },
        });
      }

      // Automatic initial follow-up task, due today, prioritised by lead.
      await prisma.task.create({
        data: {
          title: `Initial follow-up with ${t.firstName} ${t.lastName}`,
          description: `${t.companyName} — ${t.requirement}`,
          priority: t.priority,
          status: "PENDING",
          dueDate: new Date(),
          assignedUserId: assignee?.id ?? null,
          leadId: lead.id,
        },
      });

      createdIds.push(lead.id);
    } catch {
      skipped.push(t.email);
    }
  }

  await prisma.dailyLeadGeneration.create({
    data: {
      date: today,
      count: createdIds.length,
      status:
        createdIds.length >= 5
          ? "COMPLETED"
          : createdIds.length > 0
            ? "PARTIAL"
            : "FAILED",
      source,
      detail: JSON.stringify({
        created: createdIds,
        skippedDuplicateEmails: skipped,
        batch: templates.map((t) => t.email),
      }),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/leads");

  return {
    alreadyGenerated: false,
    generatedCount: createdIds.length,
    count: createdIds.length,
    message:
      createdIds.length > 0
        ? `Generated ${createdIds.length} new lead${createdIds.length > 1 ? "s" : ""} for today.`
        : "No new leads could be generated (duplicates detected).",
  };
}

/** Server action — manual "Generate Today's Leads" trigger (admin only). */
export async function generateDailyLeads(
  source: "MANUAL" | "AUTOMATIC" = "MANUAL"
) {
  const user = await assertUser();
  authorize(user, "change_settings");
  return runDailyLeadGeneration(todayDateStr(), source);
}

/** Status for the settings panel / dashboard. */
export async function getDailyLeadGenerationStatus() {
  await assertUser();
  const today = todayDateStr();
  const { start, end } = todayRange();

  const [record, todayLeads] = await Promise.all([
    prisma.dailyLeadGeneration.findUnique({ where: { date: today } }),
    prisma.lead.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "desc" },
      include: {
        assignedUser: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    record,
    todayLeads,
    activeSalespeople: await prisma.user.count({
      where: { role: { in: ["SALESPERSON", "SALES_MANAGER"] } },
    }),
  };
}