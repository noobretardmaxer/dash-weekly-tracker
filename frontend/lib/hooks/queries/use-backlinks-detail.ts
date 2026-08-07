import { useQuery } from "@tanstack/react-query";
import { getBacklinksDetail } from "@/lib/api/seo";

export function useBacklinksDetail(params: { days: number }) {
  return useQuery({
    queryKey: ["backlinks-detail", params.days],
    queryFn: () => getBacklinksDetail(params),
  });
}
