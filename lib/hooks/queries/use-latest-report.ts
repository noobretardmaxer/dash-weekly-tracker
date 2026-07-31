import { useQuery } from "@tanstack/react-query";
import { getLatestReport } from "@/lib/api/reports";

export function useLatestReport() {
  return useQuery({
    queryKey: ["reports", "latest"],
    queryFn: () => getLatestReport(),
  });
}
