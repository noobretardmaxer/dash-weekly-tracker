export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

type QueryValue = string | number | boolean | undefined | null;

function buildQueryString(params?: Record<string, QueryValue>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function apiGet<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
  const response = await fetch(`/api${path}${buildQueryString(params)}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error?.message ?? `Request to ${path} failed with ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

async function apiMutate<T>(method: "POST" | "PUT" | "PATCH", path: string, body: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new ApiError(
      errorBody?.error?.message ?? `Request to ${path} failed with ${response.status}`,
      response.status
    );
  }

  return response.json() as Promise<T>;
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiMutate<T>("POST", path, body);
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiMutate<T>("PUT", path, body);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiMutate<T>("PATCH", path, body);
}
