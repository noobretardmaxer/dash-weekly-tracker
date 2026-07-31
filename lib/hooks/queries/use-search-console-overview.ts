import { useQuery } from "@tanstack/react-query";
import { getSearchConsoleOverview } from "@/lib/api/search-console";

export function useSearchConsoleOverview(params: { days: number }) {
  return useQuery({
    queryKey: ["search-console", params.days],
    queryFn: () => getSearchConsoleOverview(params),
  });
}
