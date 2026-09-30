"use client";

import { useState, useTransition } from "react";
import {
  createLead,
  updateLead,
  updateLeadStatus,
  deleteLead,
} from "@/actions/leads";
import type { LeadInput } from "@/lib/validation/schemas";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Filter,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";

interface Lead {
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
  assignedUser?: { id: string; name: string; email: string; avatar?: string | null } | null;
  createdAt: Date | string;
}

const SOURCES = [
  "Website Form",
  "LinkedIn Outreach",
  "Cold Call",
  "Referral",
  "Conference",
  "Google Ads",
];

const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"];

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function LeadFormModal({
  lead,
  isSaving,
  onClose,
  onSave,
}: {
  lead: Lead | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: LeadInput) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: lead?.firstName ?? "",
    lastName: lead?.lastName ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    companyName: lead?.companyName ?? "",
    jobTitle: lead?.jobTitle ?? "",
    description: lead?.description ?? "",
    source: lead?.source ?? "Website Form",
    status: lead?.status ?? "NEW",
    priority: lead?.priority ?? "MEDIUM",
    estimatedValue: lead?.estimatedValue != null ? String(lead.estimatedValue) : "",
    nextFollowUpAt: toDateInputValue(lead?.nextFollowUpAt),
  });
  const isEdit = Boolean(lead);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.companyName,
      jobTitle: formData.jobTitle,
      description: formData.description,
      source: formData.source,
      status: formData.status as LeadInput["status"],
      priority: formData.priority as LeadInput["priority"],
      estimatedValue:
        formData.estimatedValue === "" ? undefined : Number(formData.estimatedValue),
      nextFollowUpAt: formData.nextFollowUpAt
        ? new Date(formData.nextFollowUpAt)
        : undefined,
    });
  };

  const inputCls =
    "w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            {isEdit ? "Edit Lead" : "Create New Lead"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Requirement / Enquiry
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputCls}
              placeholder="What does this prospect need?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Estimated Deal Value (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 25000"
                value={formData.estimatedValue}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedValue: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Next Follow-up
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Lead Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={inputCls}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={inputCls}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Lead Source *
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className={inputCls}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/25 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadsSearchBar({
  initialQuery,
  onSubmit,
}: {
  initialQuery: string;
  onSubmit: (query: string) => void;
}) {
  const [search, setSearch] = useState(initialQuery);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(search);
      }}
      className="relative flex-1 w-full"
    >
      <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
      <input
        type="text"
        placeholder="Search leads by name, email, or company..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
      />
    </form>
  );
}

export function LeadsClientPage({
  initialLeads,
  currentQuery,
  currentStatus,
}: {
  initialLeads: Lead[];
  currentQuery: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState(currentStatus);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("q", query);
    else params.delete("q");

    if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
    else params.delete("status");

    router.push(`/leads?${params.toString()}`);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    const params = new URLSearchParams(searchParams.toString());
    if (status !== "ALL") params.set("status", status);
    else params.delete("status");

    router.push(`/leads?${params.toString()}`);
  };

  const handleSaveLead = (data: LeadInput, leadId?: string) => {
    startTransition(async () => {
      try {
        if (leadId) {
          const result = await updateLead(leadId, data);
          setLeads((prev) =>
            prev.map((l) =>
              l.id === leadId ? (result.lead as unknown as Lead) : l
            )
          );
          toast.success("Lead updated successfully!");
        } else {
          const result = await createLead(data);
          setLeads((prev) => [
            result.lead as unknown as Lead,
            ...prev.filter((l) => l.id !== result.lead.id),
          ]);
          toast.success("Lead created successfully!");
        }
        setIsModalOpen(false);
        setEditingLead(null);
      } catch (err) {
        toast.error(
          getErrorMessage(err, leadId ? "Failed to update lead" : "Failed to create lead")
        );
      }
    });
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const prev = leads;
    // Optimistic update
    setLeads((list) =>
      list.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    startTransition(async () => {
      try {
        await updateLeadStatus(id, newStatus);
        toast.success(`Lead status updated to ${newStatus}`);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to update lead status"));
        setLeads(prev);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    const prev = leads;
    setLeads((list) => list.filter((l) => l.id !== id));
    try {
      await deleteLead(id);
      toast.success("Lead deleted successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete lead"));
      setLeads(prev);
    }
  };

  const openCreate = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const statusColors: Record<string, string> = {
    NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    CONTACTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    QUALIFIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    UNQUALIFIED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    CONVERTED: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    LOST: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="w-7 h-7 text-violet-400" />
            Lead Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track, nurture, and convert inbound sales prospects into active deals.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-violet-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Lead
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <LeadsSearchBar initialQuery={currentQuery} onSubmit={handleSearch} />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-500 ml-1 hidden sm:block" />
          {["ALL", "NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilterChange(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                statusFilter === s
                  ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                  : "bg-slate-950/40 text-slate-400 border-slate-800 hover:bg-slate-800/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Lead Name</th>
                <th className="py-3.5 px-6">Company & Title</th>
                <th className="py-3.5 px-6">Contact Info</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Est. Value</th>
                <th className="py-3.5 px-6">Created</th>
                <th className="py-3.5 px-6">Assigned To</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-100">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="hover:text-violet-400 transition-colors"
                      >
                        {lead.firstName} {lead.lastName}
                      </Link>
                      <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                        Source: {lead.source}
                      </span>
                      {lead.description && (
                        <span className="block text-[11px] font-normal text-slate-500 mt-0.5 line-clamp-1 max-w-[220px]">
                          {lead.description}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>{lead.companyName || "N/A"}</span>
                      </div>
                      <span className="text-xs text-slate-500">{lead.jobTitle || "—"}</span>
                    </td>
                    <td className="py-4 px-6 space-y-0.5 text-xs text-slate-400">
                      {lead.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border bg-slate-950 outline-none cursor-pointer ${
                          statusColors[lead.status] || "text-slate-400 border-slate-700"
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="UNQUALIFIED">UNQUALIFIED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {formatCurrency(lead.estimatedValue)}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {lead.assignedUser?.name || "Unassigned"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(lead)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          title="Edit Lead"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog: Create / Edit Lead */}
      {isModalOpen && (
        <LeadFormModal
          lead={editingLead}
          isSaving={isPending}
          onClose={closeModal}
          onSave={(data) => handleSaveLead(data, editingLead?.id)}
        />
      )}
    </div>
  );
}