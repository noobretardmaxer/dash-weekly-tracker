import { useQuery } from "@tanstack/react-query";
import { getSocialPosts, type SocialPlatform } from "@/lib/api/social-leaderboard";

export function useContentPosts(params: { days?: number; platform?: SocialPlatform; pageSize?: number; page?: number; sort?: string } = {}) {
  return useQuery({
    queryKey: ["social-leaderboard", "posts", params.days, params.platform, params.pageSize, params.page, params.sort],
    queryFn: () => getSocialPosts(params),
  });
}
