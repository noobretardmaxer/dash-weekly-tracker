import { useQuery } from "@tanstack/react-query";
import { getTwitterOverview } from "@/lib/api/twitter";

export function useTwitterOverview(params: { days: number }) {
  return useQuery({
    queryKey: ["twitter", params.days],
    queryFn: () => getTwitterOverview(params),
  });
}
