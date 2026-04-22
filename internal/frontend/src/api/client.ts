import type { AppConfig, PaginatedResponse, UserProfile, IdPUser } from "./types";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(path, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
}

export function getConfig(): Promise<AppConfig> {
  return apiGet("/_/api/config");
}

export function listUserProfiles(
  page = 0,
  size = 50,
  searchField?: string,
  searchValue?: string,
): Promise<PaginatedResponse<UserProfile>> {
  const arg: Record<string, unknown> = { page, size };
  if (searchField && searchValue) {
    arg.searchField = searchField;
    arg.searchValue = searchValue;
  }
  return apiGet(`/_/api/user-profiles?arg=${encodeURIComponent(JSON.stringify(arg))}`);
}

export function getUserProfile(id: string): Promise<UserProfile> {
  return apiGet(`/_/api/user-profiles/${id}`);
}

export function createUserProfile(data: Record<string, unknown>): Promise<UserProfile> {
  return apiPost("/_/api/user-profiles", data);
}

export function updateUserProfile(id: string, data: Record<string, unknown>): Promise<UserProfile> {
  return apiPut(`/_/api/user-profiles/${id}`, data);
}

export function deleteUserProfile(id: string): Promise<void> {
  return apiDelete(`/_/api/user-profiles/${id}`);
}

export async function listIdPUsers(
  first = 50,
  searchName?: string,
  after?: string,
): Promise<PaginatedResponse<IdPUser> & { nextPageToken?: string }> {
  const arg: Record<string, unknown> = { first };
  if (searchName) {
    arg.searchName = searchName;
  }
  if (after) {
    arg.after = after;
  }
  const raw = await apiGet<{
    users: IdPUser[];
    totalCount: number;
    nextPageToken?: string;
  }>(`/_/api/idp-users?arg=${encodeURIComponent(JSON.stringify(arg))}`);
  return {
    collection: raw.users ?? [],
    totalCount: raw.totalCount ?? 0,
    nextPageToken: raw.nextPageToken ?? undefined,
  };
}

export function getIdPUser(id: string): Promise<IdPUser> {
  return apiGet(`/_/api/idp-users/${id}`);
}

export function createIdPUser(data: { name: string; password: string }): Promise<IdPUser> {
  return apiPost("/_/api/idp-users", data);
}

export function updateIdPUser(id: string, data: Record<string, unknown>): Promise<IdPUser> {
  return apiPut(`/_/api/idp-users/${id}`, data);
}

export function deleteIdPUser(id: string): Promise<void> {
  return apiDelete(`/_/api/idp-users/${id}`);
}

export function sendPasswordResetEmail(
  id: string,
  data: { redirectUri: string; fromName?: string; subject?: string },
): Promise<{ ok: boolean }> {
  return apiPost(`/_/api/idp-users/${id}/send-password-reset-email`, data);
}
