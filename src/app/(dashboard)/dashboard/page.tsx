import { requireAuth } from "@/lib/auth";
import { getDashboardStats } from "@/actions/dashboard";
import {
  Users,
  DollarSign,
  Briefcase,
  TrendingUp,
  Sparkles,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { AutoRefresh } from "@/components/shared/auto-refresh";
import { formatCurrency, formatDate } from "@/lib/format";

import { ResetSystemDataButton } from "@/components/settings/reset-system-data";

function daysWaiting(createdAt: Date | string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Today's Leads",
      value: stats.totals.todayLeadsCount.toString(),
      sub: `${stats.totals.workQueueCount} in work queue`,
      icon: Sparkles,
      gradient: "from-violet-500/20 to-purple-500/5 text-violet-400 border-violet-500/30",
    },
    {
      title: "Revenue Won",
      value: formatCurrency(stats.revenue.wonRevenue),
      sub: `${stats.totals.todayDeals} deals created today`,
      icon: DollarSign,
      gradient: "from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30",
    },
    {
      title: "Open Pipeline",
      value: formatCurrency(stats.revenue.pipelineValue),
      sub: "Active deals (excl. Won/Lost)",
      icon: Briefcase,
      gradient: "from-blue-500/20 to-indigo-500/5 text-blue-400 border-blue-500/30",
    },
    {
      title: "Expected Value",
      value: formatCurrency(stats.revenue.expectedValue),
      sub: `Weighted by probability • ${stats.revenue.conversionRate}% conversion`,
      icon: TrendingUp,
      gradient: "from-amber-500/20 to-orange-500/5 text-amber-400 border-amber-500/30",
    },
  ];

  return (
    <AutoRefresh interval={60000}>
      <div className="space-y-8 p-6 md:p-8">
        {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Welcome back, {user.name} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is what is happening with your sales pipeline that needs you today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ResetSystemDataButton variant="compact" />
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            View Leads
          </Link>
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg shadow-lg shadow-violet-500/20 transition-all"
          >
            View Pipeline
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border bg-slate-900/60 backdrop-blur-xl relative overflow-hidden transition-colors ${stat.gradient}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {stat.title}
                </span>
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-slate-100">
                  {stat.value}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Today's Leads + Work Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Leads */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                New Leads Today
              </h2>
              <p className="text-[11px] text-slate-400">
                Fresh prospects generated for the day
              </p>
            </div>
            <Link
              href="/leads"
              className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {stats.todayLeads.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No leads generated today yet. Run the daily lead generator to start.
              </p>
            ) : (
              stats.todayLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="py-2.5 flex items-center justify-between group hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-violet-400 transition-colors">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {lead.companyName || "No Company"} • {lead.source}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Assigned: {lead.assignedUser?.name || "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20">
                      {lead.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Work Queue — needs first contact */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Work Queue — Needs First Contact
              </h2>
              <p className="text-[11px] text-slate-400">
                Unworked NEW leads, oldest first
              </p>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {stats.totals.workQueueCount}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {stats.workQueue.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Queue is clear — no NEW leads waiting for first contact.
              </p>
            ) : (
              stats.workQueue.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="py-2.5 flex items-center justify-between group hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-200 group-hover:text-violet-400 transition-colors">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {lead.companyName || "No Company"} • {formatCurrency(lead.estimatedValue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        lead.priority === "HIGH"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : lead.priority === "MEDIUM"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {lead.priority}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Waiting {daysWaiting(lead.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Follow-ups due */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              Follow-ups Due (next 24 hrs)
            </h2>
            <p className="text-[11px] text-slate-400">
              Calls and follow-up dates scheduled for your pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-medium text-rose-300">
              {stats.followUps.overdueCount} overdue
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.followUps.list.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 md:col-span-2">
              No follow-ups due in the next 24 hours.
            </p>
          ) : (
            stats.followUps.list.map((lead) => {
              const isOverdue = lead.isOverdue;
              return (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-violet-500/40 transition-colors group"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-violet-300 transition-colors">
                      {lead.firstName} {lead.lastName}
                      <span className="text-slate-500 font-normal">
                        {" "}• {lead.companyName || "No Company"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Due: {formatDate(lead.nextFollowUpAt)}
                    </p>
                  </div>
                  {isOverdue ? (
                    <span className="inline-flex items-center gap-1 shrink-0 px-2 py-1 text-[10px] font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3" />
                      OVERDUE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 shrink-0 px-2 py-1 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      DUE
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Users className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-100">{stats.totals.totalLeads}</p>
            <p className="text-[11px] text-slate-400">Total leads</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-100">{stats.totals.convertedLeads}</p>
            <p className="text-[11px] text-slate-400">Leads converted</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-100">{stats.totals.activeTasks}</p>
            <p className="text-[11px] text-slate-400">Active tasks</p>
          </div>
        </div>
      </div>
      </div>
    </AutoRefresh>
  );
}