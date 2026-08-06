import { PostHogDashboardPage } from "@/components/posthog/posthog-dashboard-page";

export default function WebsiteMetricsPage() {
  return (
    <PostHogDashboardPage
      dashboardId={1822142}
      title="Website Metrics"
      description="Unique users, organic SEO, sessions per user, top pages, and geographic breakdown."
    />
  );
}
