import type { Response } from "express";

export type PaginationMeta = { page: number; pageSize: number; total: number };

export function sendData<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
  res.json({ data, meta });
}

export function sendPaginated<T>(res: Response, data: T[], pagination: PaginationMeta, extraMeta?: Record<string, unknown>): void {
  res.json({ data, meta: { ...pagination, ...extraMeta } });
}
