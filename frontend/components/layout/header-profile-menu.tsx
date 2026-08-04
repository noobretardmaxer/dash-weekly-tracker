"use client";

import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/lib/hooks/queries/use-current-user";
import { useSettings } from "@/lib/hooks/queries/use-settings";
import { useLogout } from "@/lib/hooks/mutations/use-logout";

export function HeaderProfileMenu() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: settings } = useSettings();
  const logout = useLogout();
  const workspaceName = typeof settings?.["workspace.name"] === "string" ? (settings["workspace.name"] as string) : "";

  async function handleLogout() {
    await logout.mutateAsync();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{currentUser?.initials ?? ""}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start leading-none xl:flex">
            <span className="text-xs font-medium">{currentUser?.name ?? ""}</span>
            <span className="text-[11px] text-muted-foreground">{workspaceName}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
