import { PostHogDashboardPage } from "@/components/posthog/posthog-dashboard-page";

export default function WebsiteOverviewPage() {
  return (
    <PostHogDashboardPage
      dashboardId={1822339}
      title="Website Overview"
      description="Site-wide KPIs for the public website — traffic, acquisition, audience, engagement, and sign-up intent."
    />
  );
}
