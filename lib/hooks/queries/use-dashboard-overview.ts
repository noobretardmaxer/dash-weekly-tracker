import { useQuery } from "@tanstack/react-query";
import { getDashboardOverview } from "@/lib/api/dashboard";

export function useDashboardOverview(params: { days: number }) {
  return useQuery({
    queryKey: ["dashboard", params.days],
    queryFn: () => getDashboardOverview(params),
  });
}
