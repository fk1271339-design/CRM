import { requireAuth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Settings, User, Building, ShieldCheck, Bell, CalendarCog } from "lucide-react";
import { DailyLeadGenerator } from "@/components/settings/daily-lead-generator";
import { getDailyLeadGenerationStatus } from "@/actions/lead-generation";
import { ResetSystemDataButton } from "@/components/settings/reset-system-data";

export default async function SettingsPage() {
  const user = await requireAuth();
  const isAdmin = can(user, "change_settings");

  let generatorStatus = null;
  if (isAdmin) {
    try {
      generatorStatus = await getDailyLeadGenerationStatus();
    } catch {
      generatorStatus = null;
    }
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Settings className="w-7 h-7 text-slate-400" />
          CRM System Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account profile, daily automation, and organization settings.
        </p>
      </div>

      <ResetSystemDataButton variant="card" />

      {isAdmin && generatorStatus && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CalendarCog className="w-4 h-4" />
            Automation
          </h2>
          <DailyLeadGenerator
            record={generatorStatus.record}
            todayLeads={generatorStatus.todayLeads}
            activeSalespeople={generatorStatus.activeSalespeople}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation panel */}
        <div className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/40 text-sm font-semibold">
            <User className="w-4 h-4" />
            User Profile
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">
            <Building className="w-4 h-4" />
            Organization Details
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">
            <ShieldCheck className="w-4 h-4" />
            Permissions & RBAC
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">
            <Bell className="w-4 h-4" />
            Notifications
          </button>
        </div>

        {/* Profile Card Form */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-6">
          <h2 className="text-lg font-semibold text-slate-100 border-b border-slate-800 pb-3">
            Profile Settings
          </h2>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                readOnly
                value={user.name}
                className="w-full px-3.5 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                readOnly
                value={user.email}
                className="w-full px-3.5 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Assigned Role
              </label>
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}