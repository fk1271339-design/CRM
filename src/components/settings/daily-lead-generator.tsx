"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateDailyLeads } from "@/actions/lead-generation";
import { CalendarCog, Zap, Users, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import Link from "next/link";

interface TodayLead {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  source: string;
  status: string;
  assignedUser: { id: string; name: string } | null;
}

interface GenerationRecord {
  id: string;
  date: string;
  count: number;
  status: string;
  source: string;
  executedAt: Date | string;
}

export function DailyLeadGenerator({
  record,
  todayLeads,
  activeSalespeople,
}: {
  record: GenerationRecord | null;
  todayLeads: TodayLead[];
  activeSalespeople: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const alreadyGenerated = Boolean(record) && (record?.count ?? 0) > 0;

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await generateDailyLeads("MANUAL");
        toast.success(result.message || "Daily lead generation complete.");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error && err.message ? err.message : "Failed to generate leads"
        );
      }
    });
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-600/20 border border-violet-500/30">
            <CalendarCog className="w-4 h-4 text-violet-300" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Daily Lead Generator
            </h2>
            <p className="text-[11px] text-slate-400">
              Generates 5 realistic fresh leads per calendar day (idempotent — one batch per date).
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={alreadyGenerated || isPending}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-4 h-4" />
          {alreadyGenerated
            ? "Generated Today ✓"
            : isPending
              ? "Generating..."
              : "Generate Today's Leads"}
        </button>
      </div>

      {/* Status row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Last Run
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-200">
            {record ? formatDateTime(record.executedAt) : "Not run yet"}
          </p>
          {record && (
            <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
              Trigger: {record.source.toLowerCase()}
            </p>
          )}
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Leads Created
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-200">
            {record?.count ?? 0} / 5
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {record?.status ?? "PENDING"}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Active Salespeople
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-200">
            {activeSalespeople}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Round-robin assignment
          </p>
        </div>
      </div>

      {/* Today's generated leads */}
      {todayLeads.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Leads Generated Today
          </h3>
          <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            {todayLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-800/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lead.companyName || "No Company"} • {lead.source}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {lead.status}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {lead.assignedUser?.name || "Unassigned"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {alreadyGenerated && (
        <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Batch for {record?.date} already exists — refreshing the page will not create
          duplicate leads. New leads arrive automatically each day via the scheduled job.
        </div>
      )}

      {!alreadyGenerated && (
        <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          No batch generated yet for today. Hit the button above (or rely on the 9 AM cron job)
          to inject today&apos;s 5 leads.
        </div>
      )}
    </div>
  );
}