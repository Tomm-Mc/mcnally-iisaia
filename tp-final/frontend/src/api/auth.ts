import { apiFetch } from './client';
import type { User } from './types';

export interface LoginResponse {
  token: string;
  user: User;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/auth/me');
}
