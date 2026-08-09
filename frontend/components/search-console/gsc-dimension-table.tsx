"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { TableSkeleton } from "@/components/primitives/skeletons/table-skeleton";
import { downloadCsv } from "@/lib/utils/csv-export";
import { formatNumber } from "@/lib/utils/format";
import { useGscDimension } from "@/lib/hooks/queries/use-gsc";
import type { GscDimension, GscQueryParams } from "@/lib/api/search-console";

type SortField = "value" | "clicks" | "impressions" | "ctr" | "position";

const NUMERIC: { field: Exclude<SortField, "value">; label: string; format: (v: number) => string }[] = [
  { field: "clicks", label: "Clicks", format: (v) => formatNumber(v) },
  { field: "impressions", label: "Impressions", format: (v) => formatNumber(v) },
  { field: "ctr", label: "CTR", format: (v) => `${(v * 100).toFixed(1)}%` },
  { field: "position", label: "Position", format: (v) => v.toFixed(1) },
];

/** Server-paginated, sortable, searchable table for one GSC dimension. */
export function GscDimensionTable({
  dimension,
  valueLabel,
  params,
}: {
  dimension: GscDimension;
  valueLabel: string;
  params: GscQueryParams;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("clicks");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // debounce the search box → server query
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // reset to page 1 whenever the query shape changes (keyed on stable values,
  // not the params object identity, so an unrelated re-render won't reset paging)
  const paramsKey = JSON.stringify(params);
  useEffect(() => setPage(1), [dimension, pageSize, sortField, sortDir, search, paramsKey]);

  const { data, isLoading, isError } = useGscDimension(dimension, {
    ...params,
    page,
    pageSize,
    sort: `${sortField}:${sortDir}`,
    search: search || undefined,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  const toggleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir(field === "value" ? "asc" : "desc");
    }
  };

  const handleExport = () => {
    downloadCsv(
      `gsc-${dimension}`,
      [valueLabel, "Clicks", "Impressions", "CTR", "Position"],
      rows.map((r) => [r.value, r.clicks, r.impressions, `${(r.ctr * 100).toFixed(2)}%`, r.position.toFixed(1)])
    );
  };

  const sortIcon = (field: SortField) =>
    field === sortField ? (
      sortDir === "asc" ? (
        <ArrowUp className="size-3" />
      ) : (
        <ArrowDown className="size-3" />
      )
    ) : null;

  const columns = useMemo(() => NUMERIC, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="relative w-64 max-w-full">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Search ${valueLabel.toLowerCase()}…`}
            className="h-8 pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!rows.length}>
          <Download className="mr-1.5 size-3.5" />
          Export CSV
        </Button>
      </div>

      {isError ? (
        <ErrorState description="This table couldn't load its data." />
      ) : isLoading ? (
        <TableSkeleton rows={pageSize} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-card hover:bg-card">
                    <TableHead className="bg-card">
                      <button className="flex items-center gap-1 font-medium" onClick={() => toggleSort("value")}>
                        {valueLabel} {sortIcon("value")}
                      </button>
                    </TableHead>
                    {columns.map((c) => (
                      <TableHead key={c.field} className="bg-card text-right">
                        <button className="ml-auto flex items-center gap-1 font-medium" onClick={() => toggleSort(c.field)}>
                          {c.label} {sortIcon(c.field)}
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length ? (
                    rows.map((r) => (
                      <TableRow key={r.value}>
                        <TableCell className="max-w-[420px] truncate" title={r.value}>
                          {r.value}
                        </TableCell>
                        {columns.map((c) => (
                          <TableCell key={c.field} className="text-right tabular-nums">
                            {c.format(r[c.field])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={columns.length + 1} className="h-auto p-0">
                        <EmptyState title="No rows" description="No data for this dimension in the selected range." className="border-0" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-7 w-[68px]" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span>
                {from}–{to} of {formatNumber(total)}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn("size-7")}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
