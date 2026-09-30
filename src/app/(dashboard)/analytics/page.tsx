import { requireAuth, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize, buildOwnershipFilter } from "@/lib/permissions";
import { Prisma } from "@prisma/client";
import { TrendingUp, PieChart, BarChart2, Users, Target, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default async function AnalyticsPage() {
  const user = await requireAuth();

  // Scope all report queries to the caller's permission level.
  const session = await getCurrentUser();
  const level = authorize(user, "view_reports");
  const ownershipFilter = buildOwnershipFilter(level, session?.id || user.id);
  const leadFilter = ownershipFilter as Prisma.LeadWhereInput;
  const dealFilter = ownershipFilter as Prisma.DealWhereInput;

  const [
    leadsByStatus,
    dealsByStage,
    totalRevenue,
    leadsBySource,
    convertedBySource,
    closedDeals,
  ] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
      where: leadFilter,
      _count: { id: true },
    }),
    prisma.deal.groupBy({
      by: ["stage"],
      where: dealFilter,
      _sum: { value: true },
      _count: { id: true },
    }),
    prisma.deal.aggregate({
      _sum: { value: true },
      where: { ...dealFilter, stage: "WON" },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: leadFilter,
      _count: { id: true },
      _sum: { estimatedValue: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { ...leadFilter, status: "CONVERTED" },
      _count: { id: true },
    }),
    prisma.deal.groupBy({
      by: ["stage"],
      where: { ...dealFilter, stage: { in: ["WON", "LOST"] } },
      _count: { id: true },
    }),
  ]);

  const maxStageValue = Math.max(
    1,
    ...dealsByStage.map((item) => item._sum.value || 0)
  );

  const sourceConversion = new Map(
    convertedBySource.map((c) => [c.source, c._count.id])
  );

  const totalLeads = leadsByStatus.reduce((sum, s) => sum + s._count.id, 0);
  const convertedLeads = leadsByStatus.find((s) => s.status === "CONVERTED")?._count.id ?? 0;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  const wonCount = closedDeals.find((d) => d.stage === "WON")?._count.id ?? 0;
  const lostCount = closedDeals.find((d) => d.stage === "LOST")?._count.id ?? 0;
  const winRate =
    wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

  const funnel = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED"].map((stage) => {
    const row = leadsByStatus.find((s) => s.status === stage);
    return { stage, count: row?._count.id ?? 0 };
  });

  const maxSourceCount = Math.max(1, ...leadsBySource.map((s) => s._count.id));

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-emerald-400" />
          Analytics & Performance
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Conversion rates, revenue projections, source quality, and pipeline breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <p className="text-xs text-slate-500 font-medium">Total Closed-Won Revenue</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(totalRevenue._sum.value || 0)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <p className="text-xs text-slate-500 font-medium">Lead → Deal Conversion</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {Math.round(conversionRate * 10) / 10}%
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <p className="text-xs text-slate-500 font-medium">Closed Deal Win Rate</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">
            {Math.round(winRate * 10) / 10}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Filter className="w-5 h-5 text-violet-400" />
            Lead Conversion Funnel
          </h2>
          <div className="space-y-3">
            {funnel.map((item) => {
              const share = totalLeads > 0 ? (item.count / totalLeads) * 100 : 0;
              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{item.stage}</span>
                    <span className="text-slate-400">
                      {item.count} leads • {Math.round(share)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.stage === "CONVERTED"
                          ? "bg-emerald-500"
                          : item.stage === "QUALIFIED"
                            ? "bg-violet-500"
                            : "bg-indigo-500"
                      }`}
                      style={{ width: `${Math.min(share, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Source Analytics */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Lead Sources — Quality
          </h2>
          <div className="space-y-3">
            {leadsBySource.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No leads recorded yet.
              </p>
            ) : (
              leadsBySource.map((item) => {
                const converted = sourceConversion.get(item.source) ?? 0;
                const rate =
                  item._count.id > 0 ? (converted / item._count.id) * 100 : 0;
                return (
                  <div key={item.source} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{item.source}</span>
                      <span className="text-slate-400">
                        {item._count.id} leads • {Math.round(rate)}% converted •{" "}
                        {formatCurrency(item._sum.estimatedValue || 0)} est.
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full"
                        style={{ width: `${(item._count.id / maxSourceCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline Value by Stage */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            Deal Value by Stage
          </h2>

          <div className="space-y-3">
            {dealsByStage.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No deals recorded yet.
              </p>
            ) : (
              dealsByStage.map((item) => {
                const val = item._sum.value || 0;
                return (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{item.stage}</span>
                      <span className="text-emerald-400">{formatCurrency(val)}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.stage === "WON"
                            ? "bg-emerald-500"
                            : item.stage === "LOST"
                              ? "bg-slate-500"
                              : "bg-gradient-to-r from-indigo-500 to-emerald-500"
                        }`}
                        style={{ width: `${(val / maxStageValue) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-violet-400" />
            Lead Status Distribution
          </h2>

          <div className="space-y-3">
            {leadsByStatus.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No leads recorded yet.
              </p>
            ) : (
              leadsByStatus.map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{item.status}</span>
                    <span className="text-slate-400">{item._count.id} leads</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-500 h-full rounded-full"
                      style={{ width: `${totalLeads > 0 ? (item._count.id / totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          Summary
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs text-slate-500 font-medium">Total Leads</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{totalLeads}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs text-slate-500 font-medium">Leads Converted</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{convertedLeads}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs text-slate-500 font-medium">Won / Lost Deals</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {wonCount} / {lostCount}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs text-slate-500 font-medium">Active Pipeline Stages</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{dealsByStage.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}