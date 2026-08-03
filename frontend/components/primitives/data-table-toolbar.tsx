"use client";

import type { ReactNode } from "react";
import type { Table } from "@tanstack/react-table";
import { Download, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder,
  onExportCsv,
  extraFilters,
}: {
  table: Table<TData>;
  searchPlaceholder: string;
  onExportCsv: () => void;
  extraFilters?: ReactNode;
}) {
  const globalFilter = (table.getState().globalFilter as string) ?? "";
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full max-w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-8 text-sm"
          />
        </div>
        {extraFilters}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
          >
            Reset
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onExportCsv}>
        <Download className="size-3.5" />
        Export CSV
      </Button>
    </div>
  );
}
