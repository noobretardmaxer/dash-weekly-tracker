import { PostHogDashboardPage } from "@/components/posthog/posthog-dashboard-page";

export default function UtmLinkSearchPage() {
  return (
    <PostHogDashboardPage
      dashboardId={1863455}
      title="UTM Link Search"
      description="Search and filter UTM-tagged traffic — total visitors, daily trends, source breakdown, and landing pages."
    />
  );
}
