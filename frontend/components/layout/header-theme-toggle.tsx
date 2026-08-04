"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/hooks/use-theme";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function HeaderThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</TooltipContent>
    </Tooltip>
  );
}
