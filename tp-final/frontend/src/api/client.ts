import type { ApiErrorBody } from './types';

export const TOKEN_KEY = 'charla_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Se ejecuta cuando el backend responde 401, para limpiar la sesión y redirigir. */
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(handler: () => void): void {
  onUnauthorized = handler;
}

export function triggerUnauthorized(): void {
  clearToken();
  onUnauthorized?.();
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api${path}`, { ...options, headers });

  if (response.status === 401) {
    triggerUnauthorized();
    throw new ApiError(401, 'UNAUTHORIZED', 'Tu sesión expiró, iniciá sesión de nuevo.');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.error.code ?? 'UNKNOWN_ERROR',
      body?.error.message ?? 'Ocurrió un error inesperado.'
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
