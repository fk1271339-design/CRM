import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shield, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/format";

export default async function AuditLogPage() {
  await requireAuth();

  const activities = await prisma.activity.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, role: true } },
      lead: { select: { firstName: true, lastName: true } },
      deal: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Shield className="w-7 h-7 text-indigo-400" />
          Audit & System Logs
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete, unalterable trail of system actions, updates, and user activities.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800/60">
          {activities.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No audit activities recorded.
            </p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="p-4 flex items-start gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100">
                      {act.title}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{act.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span>Performed by: {act.user.name} ({act.user.role})</span>
                    {act.deal && <span>Deal: {act.deal.name}</span>}
                    {act.lead && (
                      <span>
                        Lead: {act.lead.firstName} {act.lead.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
