import { apiFetch, getToken, triggerUnauthorized } from './client';
import type { CorrectionError, Message, Quality, Session, SessionSummary } from './types';

export function createSession(scenarioId: string): Promise<{ session: Session }> {
  return apiFetch<{ session: Session }>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ scenarioId }),
  });
}

export function fetchSessions(): Promise<{ sessions: Session[] }> {
  return apiFetch<{ sessions: Session[] }>('/sessions');
}

export function fetchSession(id: string): Promise<{ session: Session }> {
  return apiFetch<{ session: Session }>(`/sessions/${id}`);
}

export interface FinishSessionResponse {
  session: Session;
  summary: SessionSummary;
  xpEarned: number;
  user: { xp: number; streakDays: number; level: string };
}

export function finishSession(id: string): Promise<FinishSessionResponse> {
  return apiFetch<FinishSessionResponse>(`/sessions/${id}/finish`, { method: 'POST' });
}

export interface CorrectorEventPayload {
  errors: CorrectionError[];
  correctedMessage: string;
  quality: Quality;
}

export interface DoneEventPayload {
  userMessage: Message;
  assistantMessage: Message;
  xpEarned: number;
}

interface StreamCallbacks {
  onCorrection: (payload: CorrectorEventPayload) => void;
  onToken: (token: string) => void;
  onDone: (payload: DoneEventPayload) => void;
  onError: (message: string) => void;
}

/**
 * Envía un mensaje y consume la respuesta SSE del backend "a mano" (no se
 * puede usar EventSource porque necesita POST + header Authorization).
 */
export async function streamMessage(sessionId: string, content: string, callbacks: StreamCallbacks): Promise<void> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    });
  } catch {
    callbacks.onError('No se pudo conectar con el servidor. Revisá tu conexión.');
    return;
  }

  if (response.status === 401) {
    triggerUnauthorized();
    callbacks.onError('Tu sesión expiró, iniciá sesión de nuevo.');
    return;
  }

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null);
    callbacks.onError(body?.error?.message ?? 'Ocurrió un error inesperado.');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      dispatchEvent(rawEvent, callbacks);
      boundary = buffer.indexOf('\n\n');
    }
  }
}

function dispatchEvent(rawEvent: string, callbacks: StreamCallbacks): void {
  let eventName = 'message';
  let dataStr = '';

  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataStr += line.slice('data:'.length).trim();
    }
  }

  if (!dataStr) return;
  const data = JSON.parse(dataStr);

  switch (eventName) {
    case 'correction':
      callbacks.onCorrection(data as CorrectorEventPayload);
      break;
    case 'token':
      callbacks.onToken((data as { token: string }).token);
      break;
    case 'done':
      callbacks.onDone(data as DoneEventPayload);
      break;
    case 'error':
      callbacks.onError((data as { message: string }).message);
      break;
  }
}
