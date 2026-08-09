import { Search } from "lucide-react";
import { EmptyState } from "@/components/primitives/empty-state";

/** Honest empty state when no property is connected / accessible yet. */
export function GscNoProperty() {
  return (
    <EmptyState
      icon={Search}
      title="No Search Console property connected"
      description="Grant the service-account email access to a property in Search Console, then run a sync. Verify the connection with `npm run gsc:doctor`."
    />
  );
}
