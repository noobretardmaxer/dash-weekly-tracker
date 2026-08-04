"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useAcceptInvite } from "@/lib/hooks/mutations/use-accept-invite";

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const acceptInvite = useAcceptInvite();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await acceptInvite.mutateAsync({ token, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (!token) {
    return (
      <div className="rounded-md bg-red-50 border border-red-100 px-3.5 py-2.5">
        <p className="text-sm text-red-700">This invite link is missing a token.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Accept invite</h1>
        <p className="text-sm text-gray-500">Set a password to activate your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-900/20 focus-visible:border-gray-400"
            minLength={8}
            required
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-100 px-3.5 py-2.5">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium"
          disabled={acceptInvite.isPending}
        >
          {acceptInvite.isPending ? "Activating…" : "Activate account"}
        </Button>
      </form>
    </div>
  );
}
