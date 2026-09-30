"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, LogOut, Mail, Settings, UserRound } from "lucide-react";
import { getNotifications, markAllNotificationsRead } from "@/actions/notifications";
import { logout } from "@/actions/auth";
import { formatDateTime } from "@/lib/format";

interface Notif {
  id: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside]);
}

export function Topbar({ user }: { user: { name: string; email: string; role: string } }) {
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const closeBell = useCallback(() => setBellOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);

  useClickOutside(bellRef, closeBell);
  useClickOutside(profileRef, closeProfile);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.notifications);
      setUnread(res.unreadCount);
    } catch {
      // ignore background poll errors
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
    const id = setInterval(loadNotifications, 60000);
    return () => clearInterval(id);
  }, []);

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Notification Bell */}
      <div className="relative" ref={bellRef}>
        <button
          onClick={() => setBellOpen((v) => !v)}
          className="relative p-2 text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-indigo-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 mt-2 w-80 max-w-[80vw] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-slate-100">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-500">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || "/dashboard"}
                    onClick={() => setBellOpen(false)}
                    className={`block px-4 py-3 border-b border-slate-800/60 text-xs hover:bg-slate-800/40 transition-colors ${
                      n.isRead ? "opacity-50" : ""
                    }`}
                  >
                    <p className={`font-medium ${n.isRead ? "text-slate-400" : "text-slate-100"}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar & Profile Dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/40 transition-all"
          aria-label="Account menu"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </button>

        {profileOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <Mail className="w-3 h-3 shrink-0" /> {user.email}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {user.role.replace("_", " ")}
              </span>
            </div>
            <div className="py-1.5">
              <Link
                href="/dashboard"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                <UserRound className="w-4 h-4" /> My Profile
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}