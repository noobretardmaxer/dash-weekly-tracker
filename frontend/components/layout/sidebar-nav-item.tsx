"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { NavItem } from "@/lib/constants/nav-items";

export function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  if (item.locked) {
    const lockedEl = (
      <span
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-not-allowed select-none",
          collapsed && "justify-center px-2",
          "text-sidebar-foreground/35"
        )}
      >
        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            <Lock className="size-3 shrink-0 opacity-60" />
          </>
        )}
      </span>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>{lockedEl}</TooltipTrigger>
        <TooltipContent side={collapsed ? "right" : "top"}>
          {collapsed ? item.label : "Coming soon"}
        </TooltipContent>
      </Tooltip>
    );
  }

  const link = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
