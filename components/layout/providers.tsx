"use client";

import type { ReactNode } from "react";
import { DateRangeProvider } from "@/lib/hooks/use-date-range";
import { SidebarCollapsedProvider } from "@/lib/hooks/use-sidebar-collapsed";
import { UiSimulationProvider } from "@/lib/hooks/use-ui-simulation";

export function DashboardProviders({ children }: { children: ReactNode }) {
  return (
    <UiSimulationProvider>
      <DateRangeProvider>
        <SidebarCollapsedProvider>{children}</SidebarCollapsedProvider>
      </DateRangeProvider>
    </UiSimulationProvider>
  );
}
