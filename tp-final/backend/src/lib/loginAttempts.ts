/**
 * Protección anti fuerza bruta para /auth/login. Estado en memoria (no en
 * Prisma a propósito: es un único proceso de backend, y persistirlo en la
 * base sumaría una tabla y una migración para algo que se puede resetear
 * sin costo con un reinicio del contenedor). Si el backend llegara a
 * escalar a más de una instancia, esto habría que moverlo a un store
 * compartido (ej. Redis).
 */

interface AttemptRecord {
  count: number;
  windowStart: number; // epoch ms
}

const attempts = new Map<string, AttemptRecord>();

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

function currentRecord(email: string, now: Date): AttemptRecord | undefined {
  const record = attempts.get(normalize(email));
  if (!record) return undefined;
  // Ventana vencida: el intento más viejo ya no cuenta.
  if (now.getTime() - record.windowStart > LOGIN_WINDOW_MS) return undefined;
  return record;
}

/** true si el email superó el máximo de intentos fallidos dentro de la ventana actual. */
export function isLoginBlocked(email: string, now: Date = new Date()): boolean {
  const record = currentRecord(email, now);
  return (record?.count ?? 0) >= MAX_LOGIN_ATTEMPTS;
}

/** Segundos restantes hasta que se libere el bloqueo (0 si no está bloqueado). */
export function loginRetryAfterSeconds(email: string, now: Date = new Date()): number {
  const record = currentRecord(email, now);
  if (!record || record.count < MAX_LOGIN_ATTEMPTS) return 0;
  const remaining = LOGIN_WINDOW_MS - (now.getTime() - record.windowStart);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export function recordLoginFailure(email: string, now: Date = new Date()): void {
  const key = normalize(email);
  const existing = currentRecord(email, now);
  if (!existing) {
    attempts.set(key, { count: 1, windowStart: now.getTime() });
    return;
  }
  existing.count += 1;
}

export function recordLoginSuccess(email: string): void {
  attempts.delete(normalize(email));
}

/** Sólo para tests: limpia todo el estado en memoria entre casos. */
export function resetLoginAttempts(): void {
  attempts.clear();
}
