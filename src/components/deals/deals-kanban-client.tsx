"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} from "@/actions/deals";
import { DEAL_LOST_REASONS } from "@/lib/constants";
import type { DealInput } from "@/lib/validation/schemas";
import {
  Briefcase,
  Plus,
  Building2,
  Calendar,
  Link2,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";

interface Deal {
  id: string;
  name: string;
  value: number;
  probability: number;
  stage: string;
  expectedCloseDate: Date | string | null;
  source: string | null;
  lostReason: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lead?: { id: string; firstName: string; lastName: string } | null;
  company?: { id: string; name: string } | null;
  contact?: { id: string; name: string; email: string | null } | null;
  assignedUser?: { id: string; name: string; avatar?: string | null } | null;
}

const STAGES = [
  { id: "NEW", label: "New Leads", color: "border-blue-500/40 bg-blue-500/5 text-blue-400" },
  { id: "CONTACTED", label: "Contacted", color: "border-amber-500/40 bg-amber-500/5 text-amber-400" },
  { id: "QUALIFIED", label: "Qualified", color: "border-cyan-500/40 bg-cyan-500/5 text-cyan-400" },
  { id: "MEETING", label: "Meeting Scheduled", color: "border-indigo-500/40 bg-indigo-500/5 text-indigo-400" },
  { id: "PROPOSAL_SENT", label: "Proposal Sent", color: "border-violet-500/40 bg-violet-500/5 text-violet-400" },
  { id: "NEGOTIATION", label: "Negotiation", color: "border-purple-500/40 bg-purple-500/5 text-purple-400" },
  { id: "WON", label: "Closed Won", color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400" },
  { id: "LOST", label: "Closed Lost", color: "border-slate-700 bg-slate-800/20 text-slate-400" },
];

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

function DealFormModal({
  deal,
  isSaving,
  onClose,
  onSave,
}: {
  deal: Deal | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: DealInput) => void;
}) {
  const [formData, setFormData] = useState({
    name: deal?.name ?? "",
    value: deal ? String(deal.value) : "",
    probability: deal ? String(deal.probability) : "",
    stage: deal?.stage ?? "NEW",
    expectedCloseDate: toDateInputValue(deal?.expectedCloseDate),
    source: deal?.source ?? "Inbound",
    lostReason: deal?.lostReason ?? "",
  });
  const isEdit = Boolean(deal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      value: formData.value === "" ? 0 : Number(formData.value),
      probability:
        formData.probability === "" ? 10 : Number(formData.probability),
      stage: formData.stage as DealInput["stage"],
      source: formData.source,
      lostReason: formData.stage === "LOST" ? formData.lostReason : undefined,
      expectedCloseDate: formData.expectedCloseDate
        ? new Date(formData.expectedCloseDate)
        : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            {isEdit ? "Edit Deal" : "Create New Deal"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Deal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise Cloud Migration"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Deal Value (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 50000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Win Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 80"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Pipeline Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
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
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Deal Source
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="Inbound">Inbound</option>
              <option value="Outbound">Outbound</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Website">Website</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.stage === "LOST" && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Lost Reason *
              </label>
              <select
                required
                value={formData.lostReason}
                onChange={(e) =>
                  setFormData({ ...formData, lostReason: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                {DEAL_LOST_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Save Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DealsKanbanClient({ initialDeals }: { initialDeals: Deal[] }) {
  const [isPending, startTransition] = useTransition();

  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [modal, setModal] = useState<{ open: boolean; deal: Deal | null }>({
    open: false,
    deal: null,
  });

  const handleStageChange = async (dealId: string, newStage: string) => {
    const prev = deals;
    // Optimistic update
    setDeals((prevList) =>
      prevList.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );

    startTransition(async () => {
      try {
        await updateDealStage(dealId, newStage);
        toast.success(`Moved deal stage to ${newStage}`);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to update deal stage"));
        setDeals(prev);
      }
    });
  };

  const handleSaveDeal = (data: DealInput, dealId?: string) => {
    startTransition(async () => {
      try {
        if (dealId) {
          const result = await updateDeal(dealId, data);
          setDeals((prevList) =>
            prevList.map((d) =>
              d.id === dealId ? (result.deal as unknown as Deal) : d
            )
          );
          toast.success("Deal updated successfully!");
        } else {
          const result = await createDeal(data);
          setDeals((prevList) => [
            result.deal as unknown as Deal,
            ...prevList.filter((d) => d.id !== result.deal.id),
          ]);
          toast.success("Deal created successfully!");
        }
        setModal({ open: false, deal: null });
      } catch (err) {
        toast.error(
          getErrorMessage(err, dealId ? "Failed to update deal" : "Failed to create deal")
        );
      }
    });
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm("Delete this deal?")) return;
    const prev = deals;
    setDeals((prevList) => prevList.filter((d) => d.id !== id));
    try {
      await deleteDeal(id);
      toast.success("Deal deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete deal"));
      setDeals(prev);
    }
  };

  const totalPipelineValue = useMemo(
    () =>
      deals
        .filter((d) => d.stage !== "LOST")
        .reduce((acc, d) => acc + d.value, 0),
    [deals]
  );

  const stageGroups = useMemo(
    () =>
      STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.id);
        return {
          stage,
          stageDeals,
          stageValue: stageDeals.reduce((sum, d) => sum + d.value, 0),
        };
      }),
    [deals]
  );

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-indigo-400" />
            Sales Pipeline & Kanban
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Total active pipeline value:{" "}
            <span className="font-semibold text-emerald-400">
              {formatCurrency(totalPipelineValue)}
            </span>
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true, deal: null })}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-violet-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Deal
        </button>
      </div>

      {/* Kanban Board Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-slate-800">
        {stageGroups.map(({ stage, stageDeals, stageValue }) => (
          <div
            key={stage.id}
            className="w-80 flex-shrink-0 flex flex-col rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl p-4 min-h-[600px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${stage.color}`}
                >
                  {stage.label}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({stageDeals.length})
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {formatCurrency(stageValue)}
              </span>
            </div>

            {/* Deal Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {stageDeals.length === 0 ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-800/60 rounded-xl text-xs text-slate-600">
                  No deals in this stage
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-violet-500/40 transition-all duration-200 shadow-md group relative space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-violet-300 transition-colors">
                        {deal.name}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setModal({ open: true, deal })}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-indigo-400 transition-opacity"
                          title="Edit Deal"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                          title="Delete Deal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(deal.value)}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {deal.probability}% win probability
                      </span>
                    </div>

{deal.company && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{deal.company.name}</span>
                        </div>
                      )}

                      {deal.lead && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-400">
                          <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Lead: {deal.lead.firstName} {deal.lead.lastName}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>
                        Expected close:{" "}
                        {formatDate(deal.expectedCloseDate)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      Created: {formatDate(deal.createdAt)}
                    </div>

                    {/* Move Stage Selector */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Move to:</span>
                      <select
                        value={deal.stage}
                        onChange={(e) => handleStageChange(deal.id, e.target.value)}
                        className="text-[11px] font-semibold bg-slate-900 border border-slate-700/60 text-slate-300 rounded px-2 py-0.5 outline-none"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Dialog: Create / Edit Deal */}
      {modal.open && (
        <DealFormModal
          deal={modal.deal}
          isSaving={isPending}
          onClose={() => setModal({ open: false, deal: null })}
          onSave={(data) => handleSaveDeal(data, modal.deal?.id)}
        />
      )}
    </div>
  );
}