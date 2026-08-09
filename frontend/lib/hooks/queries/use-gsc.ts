import { useQuery } from "@tanstack/react-query";
import {
  getGscProperties,
  getGscSummary,
  getGscTimeseries,
  getGscDimension,
  getGscIndexStatus,
  getGscCoverageUrls,
  getGscSitemaps,
  getGscUrlInspection,
  getGscCoreWebVitals,
  getGscSyncStatus,
  type GscDimension,
  type GscQueryParams,
  type Granularity,
} from "@/lib/api/search-console";

export function useGscProperties() {
  return useQuery({ queryKey: ["gsc", "properties"], queryFn: getGscProperties, staleTime: 5 * 60_000 });
}

export function useGscSummary(params: GscQueryParams) {
  return useQuery({ queryKey: ["gsc", "summary", params], queryFn: () => getGscSummary(params) });
}

export function useGscTimeseries(params: GscQueryParams & { granularity?: Granularity }) {
  return useQuery({ queryKey: ["gsc", "timeseries", params], queryFn: () => getGscTimeseries(params) });
}

export function useGscDimension(
  dimension: GscDimension,
  params: GscQueryParams & { page?: number; pageSize?: number; sort?: string; search?: string },
  enabled = true
) {
  return useQuery({
    queryKey: ["gsc", "dimension", dimension, params],
    queryFn: () => getGscDimension(dimension, params),
    enabled,
  });
}

export function useGscIndexStatus(property?: string) {
  return useQuery({ queryKey: ["gsc", "index-status", property], queryFn: () => getGscIndexStatus(property) });
}

export function useGscCoverageUrls(property: string | undefined, coverageState: string | null, page = 1, pageSize = 25) {
  return useQuery({
    queryKey: ["gsc", "coverage", property, coverageState, page, pageSize],
    queryFn: () => getGscCoverageUrls(property, coverageState as string, page, pageSize),
    enabled: Boolean(coverageState),
  });
}

export function useGscSitemaps(property?: string) {
  return useQuery({ queryKey: ["gsc", "sitemaps", property], queryFn: () => getGscSitemaps(property) });
}

export function useGscUrlInspection(property: string | undefined, url: string | null) {
  return useQuery({
    queryKey: ["gsc", "url-inspection", property, url],
    queryFn: () => getGscUrlInspection(property, url as string),
    enabled: Boolean(url),
  });
}

export function useGscCoreWebVitals() {
  return useQuery({ queryKey: ["gsc", "core-web-vitals"], queryFn: getGscCoreWebVitals });
}

export function useGscSyncStatus() {
  return useQuery({ queryKey: ["gsc", "sync-status"], queryFn: getGscSyncStatus, staleTime: 60_000, refetchInterval: 5 * 60_000 });
}
