import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { BacklinksDetail } from "@/components/seo/backlinks-detail";

export default function SeoBacklinksPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Backlinks" description="Referring domains, anchor text distribution, and backlink growth." />
      <SyncStatusBanner integration="semrush" label="SEO" />
      <BacklinksDetail />
    </div>
  );
}
