-- "Domain Rating" is an Ahrefs metric inherited from this integration's Ahrefs origin.
-- Semrush's equivalent is "Authority Score" (the `As` export column the client already
-- fetches). Rename the columns to match the real data source. RENAME COLUMN preserves
-- all existing rows.
ALTER TABLE "seo_metrics" RENAME COLUMN "domainRating" TO "authorityScore";
ALTER TABLE "competitor_metrics" RENAME COLUMN "domainRating" TO "authorityScore";

-- SEO data is now always real Semrush (the mock client was removed); default the source
-- marker accordingly. Existing rows are untouched.
ALTER TABLE "seo_metrics" ALTER COLUMN "source" SET DEFAULT 'semrush';
