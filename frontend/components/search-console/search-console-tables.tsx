"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/primitives/data-table";
import type { SearchConsoleOverviewResponse } from "@/lib/api/search-console";
import { formatCompactNumber, formatPercent } from "@/lib/utils/format";

type MetricRow = { clicks: number; impressions: number; ctr: number; position: number };

function buildDimensionColumns<T extends MetricRow>(dimensionKey: keyof T, dimensionLabel: string): ColumnDef<T, unknown>[] {
  return [
    { accessorKey: dimensionKey as string, header: dimensionLabel },
    { accessorKey: "clicks", header: "Clicks", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
    { accessorKey: "impressions", header: "Impressions", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
    { accessorKey: "ctr", header: "CTR", cell: ({ getValue }) => formatPercent(getValue<number>()) },
    { accessorKey: "position", header: "Avg Position", cell: ({ getValue }) => `#${getValue<number>().toFixed(1)}` },
  ];
}

const queriesColumns = buildDimensionColumns<SearchConsoleOverviewResponse["tables"]["topQueries"][number]>("query", "Query");
const pagesColumns = buildDimensionColumns<SearchConsoleOverviewResponse["tables"]["topPages"][number]>("page", "Page");
const countriesColumns = buildDimensionColumns<SearchConsoleOverviewResponse["tables"]["countries"][number]>("country", "Country");
const devicesColumns = buildDimensionColumns<SearchConsoleOverviewResponse["tables"]["devices"][number]>("device", "Device");
const appearanceColumns = buildDimensionColumns<SearchConsoleOverviewResponse["tables"]["searchAppearance"][number]>("type", "Appearance Type");

export function SearchConsoleTables({ tables }: { tables: SearchConsoleOverviewResponse["tables"] }) {
  return (
    <Tabs defaultValue="queries">
      <TabsList className="flex-wrap">
        <TabsTrigger value="queries">Top Queries</TabsTrigger>
        <TabsTrigger value="pages">Top Pages</TabsTrigger>
        <TabsTrigger value="countries">Countries</TabsTrigger>
        <TabsTrigger value="devices">Devices</TabsTrigger>
        <TabsTrigger value="appearance">Search Appearance</TabsTrigger>
      </TabsList>
      <TabsContent value="queries" className="mt-4">
        <DataTable columns={queriesColumns} data={tables.topQueries} searchPlaceholder="Search queries…" exportFilename="search-console-queries" />
      </TabsContent>
      <TabsContent value="pages" className="mt-4">
        <DataTable columns={pagesColumns} data={tables.topPages} searchPlaceholder="Search pages…" exportFilename="search-console-pages" />
      </TabsContent>
      <TabsContent value="countries" className="mt-4">
        <DataTable columns={countriesColumns} data={tables.countries} searchPlaceholder="Search countries…" exportFilename="search-console-countries" />
      </TabsContent>
      <TabsContent value="devices" className="mt-4">
        <DataTable columns={devicesColumns} data={tables.devices} searchPlaceholder="Search devices…" exportFilename="search-console-devices" />
      </TabsContent>
      <TabsContent value="appearance" className="mt-4">
        <DataTable
          columns={appearanceColumns}
          data={tables.searchAppearance}
          searchPlaceholder="Search appearance types…"
          exportFilename="search-appearance"
        />
      </TabsContent>
    </Tabs>
  );
}
