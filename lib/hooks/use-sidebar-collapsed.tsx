"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  getSidebarCollapsed,
  getSidebarCollapsedServerSnapshot,
  setSidebarCollapsed,
  subscribeSidebarCollapsed,
} from "@/lib/hooks/sidebar-collapsed-store";

type SidebarCollapsedContextValue = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
};

const SidebarCollapsedContext = createContext<SidebarCollapsedContextValue | null>(null);

export function SidebarCollapsedProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsed,
    getSidebarCollapsedServerSnapshot
  );

  const value = useMemo(
    () => ({
      collapsed,
      toggle: () => setSidebarCollapsed(!collapsed),
      setCollapsed: setSidebarCollapsed,
    }),
    [collapsed]
  );

  return <SidebarCollapsedContext.Provider value={value}>{children}</SidebarCollapsedContext.Provider>;
}

export function useSidebarCollapsed() {
  const ctx = useContext(SidebarCollapsedContext);
  if (!ctx) throw new Error("useSidebarCollapsed must be used within a SidebarCollapsedProvider");
  return ctx;
}
