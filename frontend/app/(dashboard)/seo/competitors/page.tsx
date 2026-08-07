import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { CompetitorsTab } from "@/components/seo/competitors-tab";

export default function SeoCompetitorsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Competitors" description="Compare SEO performance against competitors." />
      <SyncStatusBanner integration="semrush" label="SEO" />
      <CompetitorsTab />
    </div>
  );
}
