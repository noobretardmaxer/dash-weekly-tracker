import { useQuery } from "@tanstack/react-query";
import { getSocialLeaderboardOverview } from "@/lib/api/social-leaderboard";

export function useSocialLeaderboardOverview(params: { days: number }) {
  return useQuery({
    queryKey: ["social-leaderboard", "overview", params.days],
    queryFn: () => getSocialLeaderboardOverview(params),
  });
}
