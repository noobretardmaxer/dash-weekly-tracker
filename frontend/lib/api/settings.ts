import { apiGet, apiPut } from "./client";

export function getSettings(): Promise<Record<string, unknown>> {
  return apiGet<{ data: Record<string, unknown> }>("/settings").then((res) => res.data);
}

export function updateSetting(key: string, value: unknown): Promise<{ key: string; value: unknown }> {
  return apiPut<{ data: { key: string; value: unknown } }>(`/settings/${key}`, { value }).then((res) => res.data);
}
