import { PostHogDashboardPage } from "@/components/posthog/posthog-dashboard-page";

export default function UtmCampaignsPage() {
  return (
    <PostHogDashboardPage
      dashboardId={1822164}
      title="UTM/Campaign Performance"
      description="Campaign performance tracking — UTM-tagged traffic, conversion rates, and landing page effectiveness."
    />
  );
}
