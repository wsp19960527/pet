import type {
  AdminAnimalItem,
  AdminModerationItem,
  AdminUserItem,
} from '@pet/shared';
import { UserStatus } from '@pet/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface AdminLoginResponse {
  data: {
    admin: { id: string; email: string; name: string; role: string };
    accessToken: string;
    refreshToken: string;
  };
}

export interface DashboardStats {
  data: {
    userCount: number;
    adminCount: number;
    pendingModeration: number;
    pendingReports: number;
    todayReports: number;
  };
}

async function adminFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Request failed');
  }
  return res.json();
}

export async function adminLogin(
  email: string,
  password: string,
): Promise<AdminLoginResponse> {
  const res = await fetch(`${API_BASE}/admin/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Login failed');
  }
  return res.json();
}

export async function fetchDashboardStats(token: string): Promise<DashboardStats> {
  return adminFetch('/admin/api/v1/auth/dashboard/stats', token);
}

export async function fetchModerationQueue(token: string) {
  return adminFetch<{ data: AdminModerationItem[] }>(
    '/admin/api/v1/moderation/queue',
    token,
  );
}

export async function moderateAnimal(
  token: string,
  id: string,
  action: 'approve' | 'reject',
  reason?: string,
) {
  return adminFetch(`/admin/api/v1/moderation/animals/${id}/decision`, token, {
    method: 'POST',
    body: JSON.stringify({ action, reason }),
  });
}

export async function fetchAdminUsers(token: string, page = 1) {
  return adminFetch<{ data: AdminUserItem[]; meta: { total: number } }>(
    `/admin/api/v1/users?page=${page}`,
    token,
  );
}

export async function banUser(token: string, id: string, status: UserStatus) {
  return adminFetch(`/admin/api/v1/users/${id}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminAnimals(
  token: string,
  params?: { moderationStatus?: string; page?: number },
) {
  const search = new URLSearchParams();
  if (params?.moderationStatus) search.set('moderationStatus', params.moderationStatus);
  if (params?.page) search.set('page', String(params.page));
  const qs = search.toString();
  return adminFetch<{ data: AdminAnimalItem[]; meta: { total: number } }>(
    `/admin/api/v1/animals${qs ? `?${qs}` : ''}`,
    token,
  );
}

export async function removeAnimal(token: string, id: string) {
  return adminFetch(`/admin/api/v1/animals/${id}/remove`, token, {
    method: 'PATCH',
  });
}

export async function fetchAdminLedger(token: string, page = 1) {
  return adminFetch<{
    data: {
      id: string;
      amountCents: number;
      type: string;
      donorPhone: string | null;
      createdAt: string;
    }[];
    meta: { total: number };
  }>(`/admin/api/v1/finance/ledger?page=${page}`, token);
}

export async function fetchAdminCrowdfunding(token: string, status?: string) {
  const qs = status ? `?status=${status}` : '';
  return adminFetch<{
    data: {
      id: string;
      title: string;
      goalAmountCents: number;
      raisedAmountCents: number;
      status: string;
    }[];
  }>(`/admin/api/v1/finance/crowdfunding${qs}`, token);
}

export async function fetchAdminWithdrawals(token: string) {
  return adminFetch<{
    data: {
      id: string;
      amountCents: number;
      status: string;
      requesterPhone: string;
      createdAt: string;
    }[];
  }>('/admin/api/v1/finance/withdrawals', token);
}

export const TOKEN_KEY = 'pet_admin_token';

/** @deprecated unused — kept for compatibility */
export function adminAuthHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}
