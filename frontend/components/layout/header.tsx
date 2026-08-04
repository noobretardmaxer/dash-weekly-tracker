"use client";

import { useDateRange } from "@/lib/hooks/use-date-range";
import { MobileNav } from "@/components/layout/mobile-nav";
import { HeaderDateRangeSelector } from "@/components/layout/header-date-range-selector";
import { HeaderCompareToggle } from "@/components/layout/header-compare-toggle";
import { HeaderLastSync } from "@/components/layout/header-last-sync";
import { HeaderGlobalSearch } from "@/components/layout/header-global-search";
import { HeaderNotifications } from "@/components/layout/header-notifications";
import { HeaderProfileMenu } from "@/components/layout/header-profile-menu";
import { HeaderThemeToggle } from "@/components/layout/header-theme-toggle";
import { OfflineBanner } from "@/components/primitives/offline-banner";

export function Header() {
  const { label } = useDateRange();

  return (
    <>
      <OfflineBanner />
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
        <MobileNav />
        <div className="hidden flex-col leading-none sm:flex">
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="mx-2 hidden h-6 w-px bg-border sm:block" />
        <HeaderDateRangeSelector />
        <HeaderCompareToggle />
        <div className="flex-1" />
        <div className="hidden sm:block">
          <HeaderGlobalSearch />
        </div>
        <HeaderLastSync />
        <HeaderThemeToggle />
        <HeaderNotifications />
        <HeaderProfileMenu />
      </header>
    </>
  );
}
