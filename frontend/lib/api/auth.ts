import { apiGet } from "./client";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
};

export function getCurrentUser(): Promise<CurrentUser> {
  return apiGet<{ data: CurrentUser }>("/auth/me").then((res) => res.data);
}
