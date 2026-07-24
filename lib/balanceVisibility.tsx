"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "kantong:balancesHidden";

const BalanceVisibilityContext = createContext<{
  hidden: boolean;
  toggle: () => void;
} | null>(null);

/** Wraps the dashboard so any component can read/toggle the hide-balances state. */
export function BalanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(true);

  // Restore the last choice on load (defaults to visible for first-time users).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setHidden(stored === "true");
  }, []);

  const toggle = () => {
    setHidden((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <BalanceVisibilityContext.Provider value={{ hidden, toggle }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  const ctx = useContext(BalanceVisibilityContext);
  if (!ctx) {
    throw new Error("useBalanceVisibility must be used within a BalanceVisibilityProvider");
  }
  return ctx;
}
