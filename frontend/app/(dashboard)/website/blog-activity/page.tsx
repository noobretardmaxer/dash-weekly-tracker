import { PostHogDashboardPage } from "@/components/posthog/posthog-dashboard-page";

export default function BlogActivityPage() {
  return (
    <PostHogDashboardPage
      dashboardId={1822007}
      title="Blog Activity"
      description="Blog traffic sources, acquisition channels, conversion funnels, and top-performing posts."
    />
  );
}
