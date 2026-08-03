import { useQuery } from "@tanstack/react-query";
import { getRedditMentions } from "@/lib/api/reddit";

// The reddit page renders a single client-side-paginated/sorted/filtered table over the full
// mention list (no server-side pagination controls in the UI), so we request a large page size
// and a wide date window to fetch effectively "all" mentions in one call.
export function useRedditMentions() {
  return useQuery({
    queryKey: ["reddit", "mentions"],
    queryFn: () => getRedditMentions({ pageSize: 200, days: 365, sort: "mentionedAt:desc" }),
  });
}
