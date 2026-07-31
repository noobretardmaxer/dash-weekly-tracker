import { useQuery } from "@tanstack/react-query";
import { getWebsiteOverview } from "@/lib/api/website";

export function useWebsiteOverview(params: { days: number }) {
  return useQuery({
    queryKey: ["website", params.days],
    queryFn: () => getWebsiteOverview(params),
  });
}
