import { useQuery } from "@tanstack/react-query";
import { getReports } from "@/lib/api/reports";

export function useReports(params: { sort?: string; status?: string; type?: string; pageSize?: number; page?: number } = {}) {
  return useQuery({
    queryKey: ["reports", params.sort, params.status, params.type, params.pageSize, params.page],
    queryFn: () => getReports(params),
  });
}
