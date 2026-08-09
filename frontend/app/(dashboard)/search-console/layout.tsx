import type { ReactNode } from "react";
import { GscSectionChrome } from "@/components/search-console/gsc-section-chrome";

// The section reads its state from the URL (property, range, search type, …),
// so it renders dynamically rather than being statically prerendered.
export const dynamic = "force-dynamic";

export default function SearchConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <GscSectionChrome />
      {children}
    </div>
  );
}
