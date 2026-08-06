import { SectionHeader } from "@/components/primitives/section-header";
import { SyncStatusBanner } from "@/components/primitives/sync-status-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoOverview } from "@/components/seo/seo-overview";
import { KeywordRankingsTable } from "@/components/seo/keyword-rankings-table";
import { CompetitorsTab } from "@/components/seo/competitors-tab";

export default function SeoPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="SEO" description="Organic performance, keyword rankings, and competitor benchmarking." />
      <SyncStatusBanner integration="semrush" label="SEO" />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Rankings</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <SeoOverview />
        </TabsContent>
        <TabsContent value="keywords" className="mt-6">
          <KeywordRankingsTable />
        </TabsContent>
        <TabsContent value="competitors" className="mt-6">
          <CompetitorsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
