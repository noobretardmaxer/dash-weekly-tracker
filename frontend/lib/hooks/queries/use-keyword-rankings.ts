import { useQuery } from "@tanstack/react-query";
import { getKeywordRankings } from "@/lib/api/seo";

export function useKeywordRankings(params: { sort?: string; search?: string; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["keyword-rankings", params.sort, params.search, params.pageSize],
    queryFn: () => getKeywordRankings(params),
  });
}
