import type { ReactNode } from "react";
import Image from "next/image";
import { AuthProviders } from "@/components/layout/auth-providers";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProviders>
      <div className="min-h-svh w-full flex bg-white">
        {/* Left branding panel — hidden on small screens */}
        <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-[#0f0f0f] px-10 py-12 shrink-0">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="HydraDB logo" width={28} height={28} className="size-7 rounded-sm" />
            <span className="text-sm font-semibold text-white tracking-tight">HydraDB</span>
          </div>

          <div className="space-y-4">
            <p className="text-2xl font-medium text-white leading-snug">
              Your growth metrics,<br />all in one place.
            </p>
            <p className="text-sm text-white/50 leading-relaxed">
              Track SEO rankings, content performance, community traction, and weekly reporting — from a single dashboard built for growth teams.
            </p>
          </div>

          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} HydraDB · Growth Dashboard
          </p>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-[360px] space-y-10">
            {/* Logo — always visible above the form */}
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="HydraDB logo" width={32} height={32} className="size-8 rounded-sm" />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold text-gray-900 tracking-tight">HydraDB</span>
                <span className="text-[11px] text-gray-400">Growth Dashboard</span>
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </AuthProviders>
  );
}
