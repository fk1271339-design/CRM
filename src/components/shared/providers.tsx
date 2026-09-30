"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

const THEME_KEY = "theme";
const listeners = new Set<() => void>();
let cachedTheme: Theme = "dark";

// Restore the stored preference once, before hydration, without touching the DOM.
// React uses this as the client snapshot; hydration stays consistent with the
// server-rendered `dark` class and re-renders on the first client update.
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") cachedTheme = stored;
  } catch {
    // localStorage unavailable — keep default
  }
}

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Theme {
  return cachedTheme;
}

function getServerSnapshot(): Theme {
  return "dark";
}

function emitChange() {
  for (const listener of listeners) listener();
}

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    cachedTheme = next;
    applyThemeClass(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore storage failures
    }
    emitChange();
  }, []);

  return { theme, setTheme };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  // Keep the `dark` class on <html> in sync with the chosen theme.
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  return <>{children}</>;
}