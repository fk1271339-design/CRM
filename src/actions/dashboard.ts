"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { authorize, buildOwnershipFilter } from "@/lib/permissions";

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

/** Aggregated, permission-scoped metrics for the dashboard. */
export async function getDashboardStats() {
  const user = await assertUser();

  const leadsLevel = authorize(user, "view_all_leads");
  const dealsLevel = authorize(user, "view_all_deals");
  const leadFilter = buildOwnershipFilter(leadsLevel, user.id);
  const dealFilter = buildOwnershipFilter(dealsLevel, user.id);

  const { start, end } = todayRange();
  const now = new Date();

  const [totalLeads, convertedLeads, todayLeads, workQueue, followUpLeads, openDeals, wonDeals, activeTasks, todayDeals] =
    await Promise.all([
      prisma.lead.count({ where: leadFilter }),
      prisma.lead.count({ where: { ...leadFilter, status: "CONVERTED" } }),
      prisma.lead.findMany({
        where: { ...leadFilter, createdAt: { gte: start, lt: end } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          source: true,
          status: true,
          createdAt: true,
          assignedUserId: true,
          assignedUser: { select: { name: true } },
        },
      }),
      prisma.lead.findMany({
        where: { ...leadFilter, status: "NEW" },
        orderBy: { createdAt: "asc" },
        take: 8,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          estimatedValue: true,
          priority: true,
          createdAt: true,
        },
      }),
      prisma.lead.findMany({
        where: {
          ...leadFilter,
          nextFollowUpAt: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
          status: { notIn: ["LOST", "CONVERTED"] },
        },
        orderBy: { nextFollowUpAt: "asc" },
        take: 8,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          nextFollowUpAt: true,
          priority: true,
        },
      }),
      prisma.deal.findMany({
        where: { ...dealFilter, stage: { notIn: ["WON", "LOST"] } },
        select: { value: true, probability: true },
      }),
      prisma.deal.aggregate({
        where: { ...dealFilter, stage: "WON" },
        _sum: { value: true },
        _count: true,
      }),
      prisma.task.count({
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
      }),
      prisma.deal.count({ where: { ...dealFilter, createdAt: { gte: start, lt: end } } }),
    ]);

  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const expectedValue = openDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const wonRevenue = wonDeals._sum.value || 0;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  const overdueLeads = followUpLeads.filter((l) => {
    const due = l.nextFollowUpAt ? new Date(l.nextFollowUpAt).getTime() : 0;
    return due < now.getTime();
  });
  const overdueIds = new Set(overdueLeads.map((l) => l.id));
  const followUpList = followUpLeads.map((l) => ({
    ...l,
    isOverdue: overdueIds.has(l.id),
  }));

  return {
    totals: {
      totalLeads,
      convertedLeads,
      activeTasks,
      todayLeadsCount: todayLeads.length,
      workQueueCount: workQueue.length,
      todayDeals,
    },
    revenue: {
      wonRevenue,
      pipelineValue,
      expectedValue,
      conversionRate: Math.round(conversionRate * 10) / 10,
    },
    todayLeads,
    workQueue,
    followUps: {
      list: followUpList,
      overdueCount: overdueLeads.length,
    },
  };
}