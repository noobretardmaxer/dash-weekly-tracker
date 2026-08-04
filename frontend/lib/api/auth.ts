import { apiGet, apiPost } from "./client";

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

export function signup(body: { email: string; password: string; name: string; workspaceName: string }): Promise<CurrentUser> {
  return apiPost<{ data: CurrentUser }>("/auth/signup", body).then((res) => res.data);
}

export function login(body: { email: string; password: string }): Promise<CurrentUser> {
  return apiPost<{ data: CurrentUser }>("/auth/login", body).then((res) => res.data);
}

export function logout(): Promise<{ success: boolean }> {
  return apiPost<{ data: { success: boolean } }>("/auth/logout", {}).then((res) => res.data);
}

export function invite(body: { email: string; name: string; role: "admin" | "member" }): Promise<CurrentUser & { inviteUrl: string }> {
  return apiPost<{ data: CurrentUser & { inviteUrl: string } }>("/auth/invite", body).then((res) => res.data);
}

export function acceptInvite(body: { token: string; password: string }): Promise<CurrentUser> {
  return apiPost<{ data: CurrentUser }>("/auth/accept-invite", body).then((res) => res.data);
}
