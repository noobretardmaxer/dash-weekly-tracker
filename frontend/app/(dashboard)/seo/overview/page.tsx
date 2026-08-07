import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { SeoOverview } from "@/components/seo/seo-overview";

export default function SeoOverviewPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="SEO Overview" description="Organic performance, keyword rankings, and traffic trends." />
      <SyncStatusBanner integration="semrush" label="SEO" />
      <SeoOverview />
    </div>
  );
}
