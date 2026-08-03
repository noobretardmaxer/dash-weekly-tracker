"use client";

import type { Header } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { flexRender } from "@tanstack/react-table";

export function DataTableColumnHeader<TData, TValue>({
  header,
}: {
  header: Header<TData, TValue>;
}) {
  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const label = flexRender(header.column.columnDef.header, header.getContext());

  if (!canSort) {
    return <span>{label}</span>;
  }

  return (
    <button
      onClick={header.column.getToggleSortingHandler()}
      className={cn(
        "flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground",
        sorted ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {label}
      {sorted === "asc" && <ArrowUp className="size-3.5" />}
      {sorted === "desc" && <ArrowDown className="size-3.5" />}
      {!sorted && <ChevronsUpDown className="size-3.5 opacity-50" />}
    </button>
  );
}
