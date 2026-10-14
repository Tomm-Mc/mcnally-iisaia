import { apiFetch } from './client';
import type { Level, User } from './types';

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

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  level: Level;
}

/** Crea la cuenta (siempre como estudiante). No devuelve token: después hay que iniciar sesión. */
export function register(input: RegisterInput): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function fetchMe(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/auth/me');
}
