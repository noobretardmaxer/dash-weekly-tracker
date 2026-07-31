import { apiGet } from "./client";

export type UserRow = {
  id: string;
  name: string;
  initials: string;
  role: string;
};

export function getUsers(): Promise<UserRow[]> {
  return apiGet<{ data: UserRow[] }>("/users").then((res) => res.data);
}
