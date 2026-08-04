import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, type SocialPlatform } from "@/lib/api/social-leaderboard";

export function useLeaderboard(params: { days?: number; platform?: SocialPlatform; sort?: "interactions" | "impressions" | "posts" } = {}) {
  return useQuery({
    queryKey: ["social-leaderboard", "leaderboard", params.days, params.platform, params.sort],
    queryFn: () => getLeaderboard(params),
  });
}
