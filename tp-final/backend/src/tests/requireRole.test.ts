import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { requireRole } from '../middleware/auth';
import { AppError } from '../lib/errors';

function requestAs(role: 'student' | 'admin' | null): Request {
  return { user: role ? { id: 'u1', email: 'x@charla.dev', level: 'B1', role } : undefined } as Request;
}

describe('requireRole', () => {
  it('deja pasar al rol pedido', () => {
    const next = vi.fn();
    requireRole('admin')(requestAs('admin'), {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('rechaza con 403 WRONG_ROLE al admin en rutas de práctica', () => {
    const next = vi.fn();
    try {
      requireRole('student')(requestAs('admin'), {} as Response, next);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(403);
      expect((err as AppError).code).toBe('WRONG_ROLE');
    }
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza con 401 si no pasó por requireAuth', () => {
    expect(() => requireRole('admin')(requestAs(null), {} as Response, vi.fn())).toThrow(AppError);
  });
});
