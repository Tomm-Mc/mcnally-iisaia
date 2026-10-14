import { apiFetch } from './client';
import type { AdminOverview, AdminUser, AdminUserDetail, DailyActivity, LoginEvent } from './types';

export function fetchAdminOverview(): Promise<AdminOverview> {
  return apiFetch<AdminOverview>('/admin/overview');
}

export function fetchAdminActivity(days = 30): Promise<{ activity: DailyActivity[] }> {
  return apiFetch<{ activity: DailyActivity[] }>(`/admin/activity?days=${days}`);
}

export function fetchAdminUsers(): Promise<{ users: AdminUser[] }> {
  return apiFetch<{ users: AdminUser[] }>('/admin/users');
}

export function fetchAdminLogins(limit = 50): Promise<{ logins: LoginEvent[] }> {
  return apiFetch<{ logins: LoginEvent[] }>(`/admin/logins?limit=${limit}`);
}

export function fetchAdminUserDetail(userId: string, days = 30): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/admin/users/${userId}/activity?days=${days}`);
}
