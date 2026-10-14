import { beforeEach, describe, expect, it } from 'vitest';
import {
  isLoginBlocked,
  loginRetryAfterSeconds,
  LOGIN_WINDOW_MS,
  MAX_LOGIN_ATTEMPTS,
  recordLoginFailure,
  recordLoginSuccess,
  resetLoginAttempts,
} from '../lib/loginAttempts';

describe('loginAttempts', () => {
  const email = 'ana@charla.dev';
  const now = new Date('2026-10-14T12:00:00.000Z');

  beforeEach(() => {
    resetLoginAttempts();
  });

  it('no bloquea a un email sin intentos previos', () => {
    expect(isLoginBlocked(email, now)).toBe(false);
  });

  it('no bloquea hasta llegar a MAX_LOGIN_ATTEMPTS fallos', () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS - 1; i += 1) {
      recordLoginFailure(email, now);
    }
    expect(isLoginBlocked(email, now)).toBe(false);
  });

  it('bloquea al llegar a MAX_LOGIN_ATTEMPTS fallos dentro de la ventana', () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      recordLoginFailure(email, now);
    }
    expect(isLoginBlocked(email, now)).toBe(true);
  });

  it('un login exitoso limpia los intentos fallidos previos', () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      recordLoginFailure(email, now);
    }
    recordLoginSuccess(email);
    expect(isLoginBlocked(email, now)).toBe(false);
  });

  it('el bloqueo se libera una vez que pasa la ventana de tiempo', () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      recordLoginFailure(email, now);
    }
    const afterWindow = new Date(now.getTime() + LOGIN_WINDOW_MS + 1000);
    expect(isLoginBlocked(email, afterWindow)).toBe(false);
  });

  it('loginRetryAfterSeconds da 0 si no está bloqueado', () => {
    recordLoginFailure(email, now);
    expect(loginRetryAfterSeconds(email, now)).toBe(0);
  });

  it('loginRetryAfterSeconds da un valor positivo apenas se bloquea', () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      recordLoginFailure(email, now);
    }
    expect(loginRetryAfterSeconds(email, now)).toBeGreaterThan(0);
    expect(loginRetryAfterSeconds(email, now)).toBeLessThanOrEqual(LOGIN_WINDOW_MS / 1000);
  });

  it('trata el email ignorando mayúsculas y espacios', () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      recordLoginFailure('  Ana@Charla.dev  ', now);
    }
    expect(isLoginBlocked('ana@charla.dev', now)).toBe(true);
  });

  it('los intentos de un email no afectan a otro', () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
      recordLoginFailure(email, now);
    }
    expect(isLoginBlocked('tomas@charla.dev', now)).toBe(false);
  });
});
