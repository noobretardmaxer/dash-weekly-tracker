"use client";

import { Database, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants/nav-items";
import { useSidebarCollapsed } from "@/lib/hooks/use-sidebar-collapsed";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";

export function Sidebar() {
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <aside
      className={cn(
        "hidden lg:flex h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex h-14 items-center gap-2 border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Database className="size-4" strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold text-sidebar-foreground">HydraDB</span>
            <span className="text-[11px] text-sidebar-foreground/60">Growth Dashboard</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={toggle}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
