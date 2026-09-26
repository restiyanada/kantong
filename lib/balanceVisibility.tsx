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

  // Balances start hidden every time the app is opened fresh. The choice is
  // kept in sessionStorage, not localStorage, so it survives reloads and
  // switching tabs within a visit but resets to hidden on the next open.
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored !== null) setHidden(stored === "true");
    } catch {
      // Storage unavailable (e.g. private mode): stay hidden.
    }
  }, []);

  const toggle = () => {
    setHidden((prev) => {
      const next = !prev;
      try {
        window.sessionStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Storage unavailable: the toggle still works for this page view.
      }
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
