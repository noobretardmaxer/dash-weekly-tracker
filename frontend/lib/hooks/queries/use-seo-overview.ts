import { useQuery } from "@tanstack/react-query";
import { getSeoOverview } from "@/lib/api/seo";

export function useSeoOverview(params: { days: number }) {
  return useQuery({
    queryKey: ["seo", params.days],
    queryFn: () => getSeoOverview(params),
  });
}
