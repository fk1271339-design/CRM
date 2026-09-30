"use client";

import { useState, useTransition } from "react";
import { createTask, updateTaskStatus } from "@/actions/tasks";
import type { TaskInput } from "@/lib/validation/schemas";
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: string;
  status: string;
  assignedUser?: { name: string; avatar?: string | null } | null;
  lead?: { firstName: string; lastName: string } | null;
  deal?: { name: string } | null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function TasksClientPage({ initialTasks }: { initialTasks: Task[] }) {
  const [isPending, startTransition] = useTransition();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
  };

  const handleToggleStatus = async (task: Task) => {
    // Optimistic update
    const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    const previousStatus = task.status;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, nextStatus);
        toast.success(nextStatus === "COMPLETED" ? "Task completed!" : "Task marked pending");
      } catch (err) {
        // Revert optimistic update
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: previousStatus } : t))
        );
        toast.error(getErrorMessage(err, "Failed to update task status"));
      }
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await createTask({
          title: formData.title,
          description: formData.description,
          priority: formData.priority as TaskInput["priority"],
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
          status: "PENDING",
        });
        // Optimistically add the new task, no reload.
        setTasks((prev) => [
          result.task as unknown as Task,
          ...prev.filter((t) => t.id !== result.task.id),
        ]);
        toast.success("Task created successfully!");
        setIsModalOpen(false);
        resetForm();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to create task"));
      }
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") return t.status !== "COMPLETED";
    if (statusFilter === "COMPLETED") return t.status === "COMPLETED";
    return true;
  });

  const priorityColors: Record<string, string> = {
    HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-amber-400" />
            Task Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize follow-up calls, client meetings, and sales action items.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl shadow-lg shadow-amber-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {["ALL", "PENDING", "COMPLETED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              statusFilter === tab
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900/50 border border-slate-800">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === "COMPLETED";

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border backdrop-blur-xl transition-all duration-200 flex items-start gap-4 ${
                  isDone
                    ? "bg-slate-950/40 border-slate-800/40 opacity-60"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <button
                  onClick={() => handleToggleStatus(task)}
                  className="mt-0.5 p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-md border border-slate-600 hover:border-emerald-400" />
                  )}
                </button>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h4
                      className={`text-sm font-semibold ${
                        isDone ? "line-through text-slate-500" : "text-slate-100"
                      }`}
                    >
                      {task.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                        priorityColors[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-400">{task.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Due: {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.deal && <span>Deal: {task.deal.name}</span>}
                    {task.lead && (
                      <span>
                        Lead: {task.lead.firstName} {task.lead.lastName}
                      </span>
                    )}
                    <span>Assigned: {task.assignedUser?.name || "Unassigned"}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog: Add New Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Create New Task
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call client regarding contract terms"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg shadow-amber-500/25 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}