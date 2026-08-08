"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants/nav-items";

export function HeaderBreadcrumb() {
  const pathname = usePathname();

  for (const item of NAV_ITEMS) {
    if (item.children) {
      for (const child of item.children) {
        if (pathname === child.href || pathname.startsWith(child.href + "/")) {
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-muted-foreground/50">›</span>
              <span className="font-medium">{child.label}</span>
            </div>
          );
        }
      }
    } else {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-medium">{item.label}</span>
          </div>
        );
      }
    }
  }

  return null;
}
