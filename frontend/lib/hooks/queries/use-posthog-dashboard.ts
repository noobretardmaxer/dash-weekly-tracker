import { useQuery } from "@tanstack/react-query";
import { getPostHogDashboard } from "@/lib/api/posthog-dashboards";

export function usePostHogDashboard(dashboardId: number) {
  return useQuery({
    queryKey: ["posthog-dashboard", dashboardId],
    queryFn: () => getPostHogDashboard(dashboardId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
