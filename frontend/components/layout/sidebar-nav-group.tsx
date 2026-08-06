"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarCollapsed } from "@/lib/hooks/use-sidebar-collapsed";
import type { NavItem } from "@/lib/constants/nav-items";

export function SidebarNavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const { setCollapsed } = useSidebarCollapsed();
  const isChildActive = item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")) ?? false;
  const [open, setOpen] = useState(isChildActive);
  const Icon = item.icon;

  const handleClick = () => {
    if (collapsed) {
      setCollapsed(false);
      setOpen(true);
      return;
    }
    setOpen((prev) => !prev);
  };

  const trigger = (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        collapsed && "justify-center px-2",
        isChildActive
          ? "text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{item.label}</span>
          <ChevronRight
            className={cn("size-3.5 shrink-0 transition-transform duration-200", open && "rotate-90")}
          />
        </>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      {trigger}
      {open && item.children && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
          {item.children.map((child) => {
            const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
