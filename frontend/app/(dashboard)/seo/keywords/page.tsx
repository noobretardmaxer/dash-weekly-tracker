import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { KeywordRankingsTable } from "@/components/seo/keyword-rankings-table";

export default function SeoKeywordsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Keyword Rankings" description="Track organic keyword positions and movements." />
      <SyncStatusBanner integration="semrush" label="SEO" />
      <KeywordRankingsTable />
    </div>
  );
}
