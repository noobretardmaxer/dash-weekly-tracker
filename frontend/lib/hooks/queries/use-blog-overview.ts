import { useQuery } from "@tanstack/react-query";
import { getBlogOverview } from "@/lib/api/blog";

export function useBlogOverview(params: { days: number }) {
  return useQuery({
    queryKey: ["blog", params.days],
    queryFn: () => getBlogOverview(params),
  });
}
