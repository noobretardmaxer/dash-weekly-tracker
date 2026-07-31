"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/primitives/data-table";
import {
  topQueries,
  topPages,
  countries,
  devices,
  searchAppearance,
  discoverPerformance,
} from "@/lib/mock-data/search-console";
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

const queriesColumns = buildDimensionColumns<(typeof topQueries)[number]>("query", "Query");
const pagesColumns = buildDimensionColumns<(typeof topPages)[number]>("page", "Page");
const countriesColumns = buildDimensionColumns<(typeof countries)[number]>("country", "Country");
const devicesColumns = buildDimensionColumns<(typeof devices)[number]>("device", "Device");
const appearanceColumns = buildDimensionColumns<(typeof searchAppearance)[number]>("type", "Appearance Type");

const discoverColumns: ColumnDef<(typeof discoverPerformance)[number], unknown>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "impressions", header: "Impressions", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
  { accessorKey: "clicks", header: "Clicks", cell: ({ getValue }) => formatCompactNumber(getValue<number>()) },
];

export function SearchConsoleTables() {
  return (
    <Tabs defaultValue="queries">
      <TabsList className="flex-wrap">
        <TabsTrigger value="queries">Top Queries</TabsTrigger>
        <TabsTrigger value="pages">Top Pages</TabsTrigger>
        <TabsTrigger value="countries">Countries</TabsTrigger>
        <TabsTrigger value="devices">Devices</TabsTrigger>
        <TabsTrigger value="discover">Discover Performance</TabsTrigger>
        <TabsTrigger value="appearance">Search Appearance</TabsTrigger>
      </TabsList>
      <TabsContent value="queries" className="mt-4">
        <DataTable columns={queriesColumns} data={topQueries} searchPlaceholder="Search queries…" exportFilename="search-console-queries" />
      </TabsContent>
      <TabsContent value="pages" className="mt-4">
        <DataTable columns={pagesColumns} data={topPages} searchPlaceholder="Search pages…" exportFilename="search-console-pages" />
      </TabsContent>
      <TabsContent value="countries" className="mt-4">
        <DataTable columns={countriesColumns} data={countries} searchPlaceholder="Search countries…" exportFilename="search-console-countries" />
      </TabsContent>
      <TabsContent value="devices" className="mt-4">
        <DataTable columns={devicesColumns} data={devices} searchPlaceholder="Search devices…" exportFilename="search-console-devices" />
      </TabsContent>
      <TabsContent value="discover" className="mt-4">
        <DataTable columns={discoverColumns} data={discoverPerformance} searchPlaceholder="Search dates…" exportFilename="discover-performance" />
      </TabsContent>
      <TabsContent value="appearance" className="mt-4">
        <DataTable
          columns={appearanceColumns}
          data={searchAppearance}
          searchPlaceholder="Search appearance types…"
          exportFilename="search-appearance"
        />
      </TabsContent>
    </Tabs>
  );
}
