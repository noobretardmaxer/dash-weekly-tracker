"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/constants/nav-items";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/constants/nav-items";

function MobileNavItem({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const isChildActive = item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")) ?? false;
  const [open, setOpen] = useState(isChildActive);

  if (!item.children) {
    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <item.icon className="size-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm",
          isChildActive ? "text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <item.icon className="size-4" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronRight className={cn("size-3.5 transition-transform duration-200", open && "rotate-90")} />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
          {item.children.map((child) => {
            const isActive = pathname === child.href || pathname.startsWith(child.href + "/");
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-[13px]",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <div className="flex size-7 items-center justify-center">
              <Image src="/logo.png" alt="HydraDB logo" width={28} height={28} className="size-7" />
            </div>
            HydraDB
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-0.5 p-2">
          {NAV_ITEMS.map((item) => (
            <MobileNavItem
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
