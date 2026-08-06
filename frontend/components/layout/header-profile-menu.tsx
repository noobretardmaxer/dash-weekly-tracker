"use client";

import { Settings } from "lucide-react";
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
import { useSettings } from "@/lib/hooks/queries/use-settings";

export function HeaderProfileMenu() {
  const router = useRouter();
  const { data: settings } = useSettings();
  const workspaceName = typeof settings?.["workspace.name"] === "string" ? (settings["workspace.name"] as string) : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">W</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start leading-none xl:flex">
            <span className="text-xs font-medium">{workspaceName || "Workspace"}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{workspaceName || "Workspace"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
