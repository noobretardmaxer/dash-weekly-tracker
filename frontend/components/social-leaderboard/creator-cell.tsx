import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CreatorSummary } from "@/lib/api/social-leaderboard";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CreatorCell({ creator }: { creator: CreatorSummary }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar size="sm">
        <AvatarImage src={creator.avatarUrl ?? undefined} alt={creator.name} />
        <AvatarFallback className="text-[10px]">{initialsOf(creator.name)}</AvatarFallback>
      </Avatar>
      <span className="flex flex-col leading-tight">
        <span className="whitespace-nowrap text-sm font-medium">{creator.name}</span>
        <span className="whitespace-nowrap text-xs text-muted-foreground">@{creator.handle}</span>
      </span>
    </span>
  );
}
