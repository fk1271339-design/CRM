"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  convertLead,
  addLeadNote,
  logLeadActivity,
  updateLeadAssignment,
  getAssignableUsers,
} from "@/actions/lead-detail";
import { updateLeadStatus } from "@/actions/leads";
import type { ConvertLeadInput, LeadActivityInput } from "@/lib/validation/schemas";
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Building,
  Briefcase,
  CalendarClock,
  StickyNote,
  PhoneCall,
  Rocket,
  UserCog,
  Link2,
  Clock,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

interface LeadDetailUser {
  id: string;
  name: string;
  email?: string;
}

interface LeadDetailActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: Date | string;
  user: LeadDetailUser;
}

interface LeadDetailNote {
  id: string;
  content: string;
  createdAt: Date | string;
  user: LeadDetailUser;
}

interface LeadDetailTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | string | null;
  assignedUser: LeadDetailUser | null;
}

interface LeadDetailDeal {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: Date | string | null;
  createdAt: Date | string;
  contact: { name: string } | null;
  assignedUser: LeadDetailUser | null;
}

export interface LeadDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  jobTitle: string | null;
  description: string | null;
  source: string;
  status: string;
  priority: string;
  estimatedValue: number | null;
  nextFollowUpAt: Date | string | null;
  lastContactedAt: Date | string | null;
  createdAt: Date | string;
  assignedUser: LeadDetailUser | null;
  activities: LeadDetailActivity[];
  notes: LeadDetailNote[];
  tasks: LeadDetailTask[];
  deals: LeadDetailDeal[];
}

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"];

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CONTACTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  QUALIFIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  UNQUALIFIED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  CONVERTED: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  LOST: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const ACTIVITY_ICONS: Record<string, string> = {
  CALL: "bg-blue-500/10 text-blue-400",
  EMAIL: "bg-violet-500/10 text-violet-400",
  MEETING: "bg-emerald-500/10 text-emerald-400",
  NOTE: "bg-amber-500/10 text-amber-400",
  WHATSAPP: "bg-green-500/10 text-green-400",
  STATUS_CHANGE: "bg-slate-500/10 text-slate-400",
};

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function LeadDetailClient({ lead: initial }: { lead: LeadDetail }) {
  const router = useRouter();
  const lead = initial;
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<"convert" | "note" | "activity" | "assign" | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<LeadDetailUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    getAssignableUsers()
      .then((users) => {
        if (!cancelled) setAssignableUsers(users);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isConverted = lead.status === "CONVERTED" || lead.deals.length > 0;

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      try {
        await updateLeadStatus(lead.id, status);
        toast.success(`Lead status updated to ${status}`);
        router.refresh();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to update lead status"));
      }
    });
  };

  const handleAssign = (assignedUserId: string, nextFollowUpAt?: string | null) => {
    setModal(null);
    startTransition(async () => {
      try {
        await updateLeadAssignment(lead.id, {
          assignedUserId,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        });
        toast.success("Lead assignment updated");
        router.refresh();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to update assignment"));
      }
    });
  };

  const handleConvert = (data: ConvertLeadInput) => {
    setModal(null);
    startTransition(async () => {
      try {
        await convertLead(lead.id, data);
        toast.success("Lead converted into a Customer and Deal!");
        router.refresh();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to convert lead"));
      }
    });
  };

  const handleAddNote = (content: string) => {
    setModal(null);
    startTransition(async () => {
      try {
        await addLeadNote(lead.id, content);
        toast.success("Note added to timeline");
        router.refresh();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to add note"));
      }
    });
  };

  const handleLogActivity = (data: LeadActivityInput) => {
    setModal(null);
    startTransition(async () => {
      try {
        await logLeadActivity(lead.id, data);
        toast.success("Activity logged");
        router.refresh();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to log activity"));
      }
    });
  };

  const timeline = useMemo(() => {
    const activities = lead.activities.map((a) => ({
      id: a.id,
      kind: "activity" as const,
      content: {
        type: a.type,
        title: a.title,
        description: a.description,
        userName: a.user.name,
      },
      createdAt: a.createdAt,
    }));
    const notes = lead.notes.map((n) => ({
      id: n.id,
      kind: "note" as const,
      content: { content: n.content, userName: n.user.name },
      createdAt: n.createdAt,
    }));
    return [...activities, ...notes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [lead.activities, lead.notes]);

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Back + header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal("assign")}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          >
            <UserCog className="w-4 h-4" />
            Assign
          </button>
          <button
            onClick={() => setModal("activity")}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            Log Activity
          </button>
          {!isConverted && (
            <button
              onClick={() => setModal("convert")}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50"
            >
              <Rocket className="w-4 h-4" />
              Convert to Deal
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT — lead info */}
        <div className="space-y-6 xl:col-span-2">
          {/* Lead header card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <Users className="w-6 h-6 text-violet-400" />
                  {lead.firstName} {lead.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-950 outline-none cursor-pointer ${
                      STATUS_STYLES[lead.status] || "text-slate-400 border-slate-700"
                    }`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      PRIORITY_STYLES[lead.priority] || "text-slate-400 border-slate-700"
                    }`}
                  >
                    {lead.priority} PRIORITY
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-950/60 border border-slate-800 px-2.5 py-1 rounded-full">
                    <Tag className="w-3 h-3 text-slate-500" />
                    {lead.source}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Est. Deal Value</p>
                <p className="text-2xl font-bold text-slate-100">
                  {formatCurrency(lead.estimatedValue)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Added {formatDate(lead.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <a href={`mailto:${lead.email}`} className="hover:text-violet-400">
                  {lead.email || "—"}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <a href={`tel:${lead.phone}`} className="hover:text-violet-400">
                  {lead.phone || "—"}
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building className="w-4 h-4 text-slate-500 shrink-0" />
                {lead.companyName || "—"}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
                {lead.jobTitle || "—"}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <UserCog className="w-4 h-4 text-slate-500 shrink-0" />
                {lead.assignedUser?.name || "Unassigned"}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CalendarClock className="w-4 h-4 text-slate-500 shrink-0" />
                Next follow-up: {formatDate(lead.nextFollowUpAt)}
              </div>
            </div>

            {lead.description && (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Requirement / Enquiry
                </p>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {lead.description}
                </p>
              </div>
            )}
          </div>

          {/* Linked deals */}
          {lead.deals.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-violet-400" />
                Linked Deals
                <span className="text-xs font-normal text-slate-500">
                  ({lead.deals.length})
                </span>
              </h2>
              <div className="divide-y divide-slate-800/60">
                {lead.deals.map((deal) => (
                  <div key={deal.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{deal.name}</p>
                      <p className="text-xs text-slate-500">
                        Created {formatDate(deal.createdAt)} • {deal.probability}% likely
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-100">
                        {formatCurrency(deal.value)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                          deal.stage === "WON"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : deal.stage === "LOST"
                              ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                              : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                        }`}
                      >
                        {deal.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" />
                Activity Timeline
              </h2>
              <button
                onClick={() => setModal("note")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                <StickyNote className="w-3.5 h-3.5" />
                Add Note
              </button>
            </div>

            {timeline.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No activity yet for this lead.
              </p>
            ) : (
              <ol className="relative border-l border-slate-800 ml-2 space-y-6">
                {timeline.map((item) => (
                  <li key={item.id} className="pl-6 relative">
                    <span
                      className={`absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                        item.kind === "note"
                          ? "bg-amber-400"
                          : "bg-violet-400"
                      }`}
                    />
                    {item.kind === "note" ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            Note by {item.content.userName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {item.content.content}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                              ACTIVITY_ICONS[item.content.type] || "bg-slate-500/10 text-slate-400"
                            }`}
                          >
                            {item.content.title}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                          {item.content.description}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* RIGHT — follow-ups + tasks */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-violet-400" />
              Follow-ups & Tasks
            </h2>
            {lead.tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No tasks yet.</p>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {lead.tasks.map((task) => (
                  <div key={task.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-200">
                        {task.title}
                      </p>
                      <span
                        className={`inline-block shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : task.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-1 text-xs text-slate-400">{task.description}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-500">
                      Due {formatDate(task.dueDate)} • {task.assignedUser?.name || "Unassigned"} •{" "}
                      {task.priority}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href={lead.deals.length > 0 ? "/deals" : "#"}
            onClick={(e) => {
              if (lead.deals.length === 0) {
                e.preventDefault();
                setModal("convert");
              }
            }}
            className="block p-6 rounded-2xl bg-gradient-to-br from-violet-600/15 to-indigo-600/5 border border-violet-500/30 hover:border-violet-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30">
                <Rocket className="w-5 h-5 text-violet-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-200 group-hover:text-violet-100">
                  {isConverted ? "View Pipeline / Deals" : "Convert this Lead into a Deal"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isConverted
                    ? "This lead already has a deal in the pipeline."
                    : "Create Contact, Company and Deal in one step."}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Modals */}
      {modal === "convert" && (
        <ConvertModal lead={lead} isSaving={isPending} onClose={() => setModal(null)} onSave={handleConvert} />
      )}
      {modal === "note" && (
        <NoteModal isSaving={isPending} onClose={() => setModal(null)} onSave={handleAddNote} />
      )}
      {modal === "activity" && (
        <ActivityModal isSaving={isPending} onClose={() => setModal(null)} onSave={handleLogActivity} />
      )}
      {modal === "assign" && (
        <AssignModal
          lead={lead}
          users={assignableUsers}
          isSaving={isPending}
          onClose={() => setModal(null)}
          onSave={handleAssign}
        />
      )}
    </div>
  );
}

function ConvertModal({
  lead,
  isSaving,
  onClose,
  onSave,
}: {
  lead: LeadDetail;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: ConvertLeadInput) => void;
}) {
  const [formData, setFormData] = useState({
    companyName: lead.companyName ?? "",
    companyWebsite: "",
    industry: "",
    dealName: `${lead.companyName || `${lead.firstName} ${lead.lastName}`} — Website`,
    dealValue: lead.estimatedValue != null ? String(lead.estimatedValue) : "",
    probability: "20",
    expectedCloseDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      companyName: formData.companyName,
      companyWebsite: formData.companyWebsite,
      industry: formData.industry,
      dealName: formData.dealName,
      dealValue: formData.dealValue === "" ? 0 : Number(formData.dealValue),
      probability: formData.probability === "" ? 20 : Number(formData.probability),
      expectedCloseDate: formData.expectedCloseDate
        ? new Date(formData.expectedCloseDate)
        : undefined,
    });
  };

  return (
    <Modal title="Convert Lead to Deal" subtitle="Creates a Company, Contact and Deal in one step." onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Website
            </label>
            <input
              type="text"
              value={formData.companyWebsite}
              onChange={(e) =>
                setFormData({ ...formData, companyWebsite: e.target.value })
              }
              className={inputCls}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Industry
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Deal Name *
            </label>
            <input
              type="text"
              required
              value={formData.dealName}
              onChange={(e) => setFormData({ ...formData, dealName: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Deal Value (₹) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.dealValue}
              onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Probability (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Expected Close Date
            </label>
            <input
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) =>
                setFormData({ ...formData, expectedCloseDate: e.target.value })
              }
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50"
          >
            {isSaving ? "Converting..." : "Convert Lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "WHATSAPP", "NOTE"];

function ActivityModal({
  isSaving,
  onClose,
  onSave,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: LeadActivityInput) => void;
}) {
  const [formData, setFormData] = useState({
    type: "CALL",
    title: "",
    description: "",
    nextAction: "",
    nextFollowUpAt: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type: formData.type as LeadActivityInput["type"],
      title: formData.title,
      description: formData.description,
      nextAction: formData.nextAction,
      nextFollowUpAt: formData.nextFollowUpAt
        ? new Date(formData.nextFollowUpAt)
        : undefined,
    });
  };

  return (
    <Modal title="Log Activity" subtitle="Record a call, email or meeting with this lead." onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Activity Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className={inputCls}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputCls}
              placeholder="e.g. Introductory call"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Description / Outcome
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={inputCls}
              placeholder="What happened on the call?"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Next Action
            </label>
            <input
              type="text"
              value={formData.nextAction}
              onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
              className={inputCls}
              placeholder="e.g. Send proposal"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Follow-up Date
            </label>
            <input
              type="date"
              value={formData.nextFollowUpAt}
              onChange={(e) =>
                setFormData({ ...formData, nextFollowUpAt: e.target.value })
              }
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Log Activity"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NoteModal({
  isSaving,
  onClose,
  onSave,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
}) {
  const [content, setContent] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(content);
  };

  return (
    <Modal title="Add Note" subtitle="Capture internal context on this lead." onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Note Content *
          </label>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={inputCls}
            placeholder="Write your note..."
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Add Note"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignModal({
  lead,
  users,
  isSaving,
  onClose,
  onSave,
}: {
  lead: LeadDetail;
  users: LeadDetailUser[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (assignedUserId: string, nextFollowUpAt?: string | null) => void;
}) {
  const [assignedUserId, setAssignedUserId] = useState(lead.assignedUser?.id ?? "");
  const [nextFollowUpAt, setNextFollowUpAt] = useState(
    toDateInputValue(lead.nextFollowUpAt)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(assignedUserId, nextFollowUpAt);
  };

  return (
    <Modal title="Assign Lead" subtitle="Reassign ownership and set the next follow-up." onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Assigned To
          </label>
          <select
            value={assignedUserId}
            onChange={(e) => setAssignedUserId(e.target.value)}
            className={inputCls}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Next Follow-up
          </label>
          <input
            type="date"
            value={nextFollowUpAt}
            onChange={(e) => setNextFollowUpAt(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}