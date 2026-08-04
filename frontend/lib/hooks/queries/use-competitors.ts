import { useQuery } from "@tanstack/react-query";
import { getCompetitors } from "@/lib/api/seo";

export function useCompetitors() {
  return useQuery({
    queryKey: ["competitors"],
    queryFn: getCompetitors,
  });
}
