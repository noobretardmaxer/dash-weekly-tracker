import { ExecutiveSummaryPanel } from "@/components/dashboard/executive-summary-panel";
import { ExecutiveKpiGrid } from "@/components/dashboard/executive-kpi-grid";
import { DashboardPreviewCharts } from "@/components/dashboard/dashboard-preview-charts";

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <ExecutiveSummaryPanel />
      <ExecutiveKpiGrid />
      <DashboardPreviewCharts />
    </div>
  );
}
