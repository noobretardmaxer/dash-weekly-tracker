"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/queries/use-current-user";

// Middleware only checks cookie presence, not validity — this catches an expired/invalid
// access token (401 from /auth/me) that slipped past that optimistic check.
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isError } = useCurrentUser();

  useEffect(() => {
    if (isError) {
      router.replace("/login");
    }
  }, [isError, router]);

  return <>{children}</>;
}
