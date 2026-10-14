import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import type { Role } from '../schemas/enums';
import type { AuthUser } from '../types/express';

export interface JwtPayload {
  id: string;
  email: string;
  level: AuthUser['level'];
  // Opcional: los tokens emitidos antes de que existiera el rol no lo traen.
  role?: Role;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Falta el token de autenticación');
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: payload.id, email: payload.email, level: payload.level, role: payload.role ?? 'student' };
    next();
  } catch {
    throw AppError.unauthorized('Token inválido o expirado');
  }
}

/**
 * Restringe la ruta a un rol. Va después de requireAuth. El admin no practica
 * (no tiene sesiones, XP ni ejercicios) y el estudiante no ve el panel.
 */
export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Falta el token de autenticación');
    }
    if (req.user.role !== role) {
      throw AppError.forbidden(
        role === 'admin'
          ? 'Esta sección es sólo para administradores.'
          : 'La cuenta de administrador no puede practicar. Entrá con un usuario estudiante.',
        'WRONG_ROLE'
      );
    }
    next();
  };
}
