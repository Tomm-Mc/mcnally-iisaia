import { ApiError, getToken, triggerUnauthorized } from './client';
import type { ApiErrorBody } from './types';

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwApiError(response: Response): Promise<never> {
  if (response.status === 401) {
    triggerUnauthorized();
    throw new ApiError(401, 'UNAUTHORIZED', 'Tu sesión expiró, iniciá sesión de nuevo.');
  }
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  throw new ApiError(
    response.status,
    body?.error.code ?? 'UNKNOWN_ERROR',
    body?.error.message ?? 'Ocurrió un error inesperado.'
  );
}

/**
 * Speech-to-text: manda el audio crudo (no JSON ni multipart) y devuelve el
 * texto transcrito. Puede venir vacío si la grabación era sólo silencio.
 * `mock` es true si el backend no usa OpenAI: el texto es de ejemplo.
 */
export async function transcribeAudio(sessionId: string, audio: Blob): Promise<{ text: string; mock: boolean }> {
  const response = await fetch(`/api/sessions/${sessionId}/transcriptions`, {
    method: 'POST',
    headers: { 'Content-Type': audio.type || 'audio/webm', ...authHeaders() },
    body: audio,
  });
  if (!response.ok) {
    await throwApiError(response);
  }
  return (await response.json()) as { text: string; mock: boolean };
}

/**
 * Text-to-speech con la voz del personaje. Devuelve null si el backend está
 * en modo mock (204): en ese caso se usa la voz del navegador.
 */
export async function synthesizeSpeech(sessionId: string, text: string, signal?: AbortSignal): Promise<Blob | null> {
  const response = await fetch(`/api/sessions/${sessionId}/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ text }),
    signal,
  });
  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    await throwApiError(response);
  }
  return response.blob();
}
