import { apiGet, ApiError } from "./client";

export type ReportStatus = "Generating" | "Ready" | "Failed";

export type ExecutiveReportPayload = {
  executiveSummary: string;
  wins: { id: string; text: string }[];
  risks: { id: string; text: string }[];
  recommendations: { id: string; text: string }[];
  growthScore: number;
  healthScore: number;
  topOpportunities: { id: string; text: string }[];
  topRisks: { id: string; text: string }[];
};

export type ReportWithPayload = {
  id: string;
  name: string;
  type: string;
  status: ReportStatus;
  periodStart: string;
  periodEnd: string;
  payload: ExecutiveReportPayload;
  createdAt: string;
  updatedAt: string;
};

export async function getLatestReport(): Promise<ReportWithPayload | null> {
  try {
    const res = await apiGet<{ data: ReportWithPayload }>("/reports/latest");
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export type ReportRow = {
  id: string;
  name: string;
  type: string;
  status: ReportStatus;
  createdAt: string;
};

export type ReportsMeta = {
  page: number;
  pageSize: number;
  total: number;
  [key: string]: unknown;
};

export type ReportsResponse = {
  data: ReportRow[];
  meta: ReportsMeta;
};

export function getReports(params: {
  sort?: string;
  status?: string;
  type?: string;
  pageSize?: number;
  page?: number;
} = {}): Promise<ReportsResponse> {
  return apiGet<ReportsResponse>("/reports", params);
}
