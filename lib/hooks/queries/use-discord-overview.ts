import { useQuery } from "@tanstack/react-query";
import { getDiscordOverview } from "@/lib/api/discord";

export function useDiscordOverview(params: { days: number }) {
  return useQuery({
    queryKey: ["discord", params.days],
    queryFn: () => getDiscordOverview(params),
  });
}
