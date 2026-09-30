"use client";

import { useTransition } from "react";
import { resetSystemData } from "@/actions/system";
import { Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ResetSystemDataButton({ variant = "card" }: { variant?: "card" | "compact" }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleReset = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear ALL CRM data? This will set Revenue Won to ₹0 and delete all leads, deals, contacts, companies, and tasks so you can start fresh."
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await resetSystemData();
        toast.success("All CRM data cleared! Revenue Won is now ₹0.");
        router.refresh();
      } catch (err) {
        toast.error("Failed to reset system data.");
      }
    });
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleReset}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        title="Reset all system data & zero out revenue"
      >
        {isPending ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
        )}
        <span>Clear All Data (Reset to ₹0)</span>
      </button>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-800/40 backdrop-blur-xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Reset CRM System & Clear Demo Data
          </h3>
          <p className="text-xs text-rose-300/70">
            Delete all demo leads, deals, contacts, companies, and tasks. This will set Revenue Won to ₹0 so you can start entering your fresh real data.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-xl shadow-lg shadow-rose-900/40 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span>{isPending ? "Resetting..." : "Clear All CRM Data"}</span>
        </button>
      </div>
    </div>
  );
}
