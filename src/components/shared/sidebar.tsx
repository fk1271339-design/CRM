"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/actions/auth";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Building2,
  Handshake,
  CheckSquare,
  ShieldCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Moon,
  Sun,
  Zap,
} from "lucide-react";
import { useTheme } from "@/components/shared/providers";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: number;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Leads", href: "/leads", icon: Users },
      { label: "Contacts", href: "/contacts", icon: UserCircle },
      { label: "Companies", href: "/companies", icon: Building2 },
      { label: "Deals", href: "/deals", icon: Handshake },
    ],
  },
  {
    title: "Productivity",
    items: [
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Audit Log", href: "/audit", icon: ShieldCheck, roles: ["ADMIN"] },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["ADMIN", "SALES_MANAGER"] },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

export function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-64"
      } h-screen bg-slate-950 border-r border-white/[0.06] flex flex-col transition-all duration-300 ease-in-out sticky top-0 shrink-0`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Faiz CRM</h2>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg transition-colors">
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[10px] text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-thin">
        {navSections.map((section) => {
          const filteredItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(userRole)
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={section.title}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-3 mb-2">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                          active
                            ? "bg-indigo-500/10 text-indigo-400"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                        } ${collapsed ? "justify-center" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          className={`w-[18px] h-[18px] shrink-0 ${
                            active ? "text-indigo-400" : "text-slate-500 group-hover:text-white"
                          }`}
                        />
                        {!collapsed && <span>{item.label}</span>}
                        {!collapsed && item.badge && (
                          <span className="ml-auto text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {theme === "dark" ? (
            <Sun className="w-[18px] h-[18px] text-slate-500" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-slate-500" />
          )}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? (
            <ChevronRight className="w-[18px] h-[18px] text-slate-500" />
          ) : (
            <ChevronLeft className="w-[18px] h-[18px] text-slate-500" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* User Info & Logout */}
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 capitalize">
                {userRole.replace("_", " ").toLowerCase()}
              </p>
            </div>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="text-slate-500 hover:text-red-400 transition-colors p-1"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
