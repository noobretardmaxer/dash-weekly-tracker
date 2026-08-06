"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/api/query-client";
import { DateRangeProvider } from "@/lib/hooks/use-date-range";
import { SidebarCollapsedProvider } from "@/lib/hooks/use-sidebar-collapsed";
import { UiSimulationProvider } from "@/lib/hooks/use-ui-simulation";

export function DashboardProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <UiSimulationProvider>
        <DateRangeProvider>
          <SidebarCollapsedProvider>{children}</SidebarCollapsedProvider>
        </DateRangeProvider>
      </UiSimulationProvider>
    </QueryClientProvider>
  );
}
