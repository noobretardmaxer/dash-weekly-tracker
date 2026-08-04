import { apiGet, apiPatch } from "./client";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  status: string;
};

export function getUsers(): Promise<UserRow[]> {
  return apiGet<{ data: UserRow[] }>("/users").then((res) => res.data);
}

export function updateUserRole(id: string, role: "admin" | "member"): Promise<UserRow> {
  return apiPatch<{ data: UserRow }>(`/users/${id}/role`, { role }).then((res) => res.data);
}
