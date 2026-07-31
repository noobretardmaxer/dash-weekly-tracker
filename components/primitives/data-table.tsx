"use client";

import { useState, type ReactNode } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableToolbar } from "@/components/primitives/data-table-toolbar";
import { DataTablePagination } from "@/components/primitives/data-table-pagination";
import { DataTableColumnHeader } from "@/components/primitives/data-table-column-header";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { downloadCsv } from "@/lib/utils/csv-export";
import { useUiSimulation } from "@/lib/hooks/use-ui-simulation";
import { cn } from "@/lib/utils";

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Search…",
  exportFilename = "export",
  onRowClick,
  maxHeight = 440,
  extraFilters,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting your search or filters.",
}: {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
  exportFilename?: string;
  onRowClick?: (row: TData) => void;
  maxHeight?: number;
  extraFilters?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { simulateError } = useUiSimulation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const handleExportCsv = () => {
    const visibleColumns = table.getVisibleLeafColumns().filter((c) => c.id !== "action");
    const headers = visibleColumns.map((c) => (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id));
    const rows = table.getFilteredRowModel().rows.map((row) => visibleColumns.map((col) => row.getValue(col.id)));
    downloadCsv(exportFilename, headers, rows);
  };

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      <DataTableToolbar table={table} searchPlaceholder={searchPlaceholder} onExportCsv={handleExportCsv} extraFilters={extraFilters} />
      {simulateError ? (
        <ErrorState description="This table couldn't load its data." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-auto" style={{ maxHeight }}>
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-card hover:bg-card">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="whitespace-nowrap bg-card">
                          {header.isPlaceholder ? null : <DataTableColumnHeader header={header} />}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {rows.length ? (
                    rows.map((row) => (
                      <TableRow
                        key={row.id}
                        onClick={() => onRowClick?.(row.original)}
                        className={cn(onRowClick && "cursor-pointer")}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={columns.length} className="h-auto p-0">
                        <EmptyState title={emptyTitle} description={emptyDescription} className="border-0" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
