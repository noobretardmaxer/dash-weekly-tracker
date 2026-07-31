"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { SectionHeader } from "@/components/primitives/section-header";
import { DataTable } from "@/components/primitives/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reports, type ReportRow, type ReportStatus } from "@/lib/mock-data/reports";
import { downloadCsv } from "@/lib/utils/csv-export";
import { formatDateFull } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<ReportStatus, string> = {
  Ready: "bg-success/10 text-success",
  Generating: "bg-muted text-muted-foreground",
  Failed: "bg-danger/10 text-danger",
};

const columns: ColumnDef<ReportRow, unknown>[] = [
  { accessorKey: "name", header: "Report" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "createdAt", header: "Date", cell: ({ getValue }) => formatDateFull(new Date(getValue<string>())) },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<ReportStatus>();
      return <Badge className={cn("border-transparent", STATUS_CLASSES[status])}>{status}</Badge>;
    },
  },
  {
    id: "action",
    header: "Action",
    enableSorting: false,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={row.original.status !== "Ready"}
        onClick={() =>
          downloadCsv(row.original.name, ["Report", "Type", "Date", "Status"], [
            [row.original.name, row.original.type, row.original.createdAt, row.original.status],
          ])
        }
      >
        <Download className="size-3.5" />
      </Button>
    ),
  },
];

export function ReportsPageContent() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Reports" description="Generated reports ready for download or sharing." />
      <DataTable columns={columns} data={reports} searchPlaceholder="Search reports…" exportFilename="reports" />
    </div>
  );
}
