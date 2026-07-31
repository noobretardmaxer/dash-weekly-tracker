import type { ReactNode } from "react";
import { DashboardProviders } from "@/components/layout/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardProviders>
      <div className="flex h-svh w-full overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6">{children}</div>
          </main>
        </div>
      </div>
    </DashboardProviders>
  );
}
