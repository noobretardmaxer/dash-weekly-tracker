-- CreateTable
CREATE TABLE "gsc_properties" (
    "id" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "permissionLevel" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gsc_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gsc_sync_runs" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "rowsWritten" INTEGER NOT NULL DEFAULT 0,
    "dateRangeStart" DATE,
    "dateRangeEnd" DATE,
    "cursor" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gsc_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gsc_daily_totals" (
    "propertyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "searchType" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "dataState" TEXT NOT NULL DEFAULT 'final',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gsc_daily_totals_pkey" PRIMARY KEY ("propertyId","date","searchType")
);

-- CreateTable
CREATE TABLE "gsc_dimension_daily" (
    "propertyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "searchType" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "dimensionValue" TEXT NOT NULL,
    "dimensionValueHash" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "dataState" TEXT NOT NULL DEFAULT 'final',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gsc_dimension_daily_pkey" PRIMARY KEY ("propertyId","date","searchType","dimension","dimensionValueHash")
);

-- CreateTable
CREATE TABLE "gsc_sitemaps" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "lastSubmitted" TIMESTAMP(3),
    "lastDownloaded" TIMESTAMP(3),
    "isPending" BOOLEAN NOT NULL DEFAULT false,
    "isSitemapsIndex" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT,
    "warnings" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "submittedUrls" INTEGER NOT NULL DEFAULT 0,
    "indexedUrls" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gsc_sitemaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gsc_url_index_status" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "verdict" TEXT,
    "coverageState" TEXT,
    "robotsTxtState" TEXT,
    "indexingState" TEXT,
    "pageFetchState" TEXT,
    "googleCanonical" TEXT,
    "userCanonical" TEXT,
    "lastCrawlTime" TIMESTAMP(3),
    "crawledAs" TEXT,
    "isHttps" BOOLEAN,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gsc_url_index_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crux_daily" (
    "id" TEXT NOT NULL,
    "originOrUrl" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "formFactor" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "lcpP75" DOUBLE PRECISION,
    "inpP75" DOUBLE PRECISION,
    "clsP75" DOUBLE PRECISION,
    "ttfbP75" DOUBLE PRECISION,
    "bucket" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crux_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gsc_properties_siteUrl_key" ON "gsc_properties"("siteUrl");

-- CreateIndex
CREATE INDEX "gsc_sync_runs_propertyId_jobType_startedAt_idx" ON "gsc_sync_runs"("propertyId", "jobType", "startedAt");

-- CreateIndex
CREATE INDEX "gsc_sync_runs_jobType_startedAt_idx" ON "gsc_sync_runs"("jobType", "startedAt");

-- CreateIndex
CREATE INDEX "gsc_daily_totals_propertyId_searchType_date_idx" ON "gsc_daily_totals"("propertyId", "searchType", "date");

-- CreateIndex
CREATE INDEX "gsc_dimension_daily_propertyId_dimension_date_idx" ON "gsc_dimension_daily"("propertyId", "dimension", "date");

-- CreateIndex
CREATE INDEX "gsc_dimension_daily_propertyId_dimension_searchType_date_idx" ON "gsc_dimension_daily"("propertyId", "dimension", "searchType", "date");

-- CreateIndex
CREATE UNIQUE INDEX "gsc_sitemaps_propertyId_path_key" ON "gsc_sitemaps"("propertyId", "path");

-- CreateIndex
CREATE INDEX "gsc_url_index_status_propertyId_coverageState_idx" ON "gsc_url_index_status"("propertyId", "coverageState");

-- CreateIndex
CREATE UNIQUE INDEX "gsc_url_index_status_propertyId_urlHash_key" ON "gsc_url_index_status"("propertyId", "urlHash");

-- CreateIndex
CREATE INDEX "crux_daily_formFactor_date_idx" ON "crux_daily"("formFactor", "date");

-- CreateIndex
CREATE UNIQUE INDEX "crux_daily_originOrUrl_formFactor_date_key" ON "crux_daily"("originOrUrl", "formFactor", "date");

-- AddForeignKey
ALTER TABLE "gsc_sync_runs" ADD CONSTRAINT "gsc_sync_runs_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "gsc_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gsc_daily_totals" ADD CONSTRAINT "gsc_daily_totals_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "gsc_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gsc_dimension_daily" ADD CONSTRAINT "gsc_dimension_daily_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "gsc_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gsc_sitemaps" ADD CONSTRAINT "gsc_sitemaps_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "gsc_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gsc_url_index_status" ADD CONSTRAINT "gsc_url_index_status_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "gsc_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

