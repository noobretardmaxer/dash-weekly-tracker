"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useSignup } from "@/lib/hooks/mutations/use-signup";

export default function SignupPage() {
  const router = useRouter();
  const signup = useSignup();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await signup.mutateAsync({ name, email, password, workspaceName });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Create a workspace</h1>
        <p className="text-sm text-gray-500">Set up your growth dashboard. You'll be the admin.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="workspaceName" className="text-sm font-medium text-gray-700">
            Workspace name
          </Label>
          <Input
            id="workspaceName"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="HydraDB Growth"
            className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-900/20 focus-visible:border-gray-400"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Your name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Johnson"
            className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-900/20 focus-visible:border-gray-400"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-900/20 focus-visible:border-gray-400"
            required
          />
        </div>

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
          disabled={signup.isPending}
        >
          {signup.isPending ? "Creating…" : "Create workspace"}
        </Button>
      </form>

      <p className="text-sm text-gray-500 text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
