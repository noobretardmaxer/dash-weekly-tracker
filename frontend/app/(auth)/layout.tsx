import type { ReactNode } from "react";
import { AuthProviders } from "@/components/layout/auth-providers";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProviders>
      <div className="flex min-h-svh w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </AuthProviders>
  );
}
